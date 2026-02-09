const { memoryStore, newId } = require('../store/memory.store');
const Booking = require('../models/Booking');
const Ground = require('../models/Ground');

function isDbConnected(req) {
  return Boolean(req.app && req.app.locals && req.app.locals.dbConnected);
}

async function getGroundById(req, groundId) {
  if (isDbConnected(req)) {
    return await Ground.findById(groundId);
  }
  return memoryStore.grounds.find(g => g.id === groundId) || null;
}

async function listConflictingBookings(req, { groundId, date, startTime, endTime }) {
  const { timeToMinutes, addMinutes, intervalsOverlap } = require('../utils/time.utils');
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || startMin >= endMin) {
    return [];
  }

  if (isDbConnected(req)) {
    const docs = await Booking.find({
      groundId,
      date,
      status: { $in: ['confirmed', 'pending_payment'] }
    });
    return docs.filter(b => {
      const bs = timeToMinutes(b.startTime);
      const be = timeToMinutes(b.endTime);
      return intervalsOverlap(startMin, endMin, bs, be);
    });
  }

  return memoryStore.bookings.filter(b => {
    if (b.groundId !== groundId || b.date !== date || !['confirmed', 'pending_payment'].includes(b.status)) return false;
    const bs = timeToMinutes(b.startTime);
    const be = timeToMinutes(b.endTime);
    return intervalsOverlap(startMin, endMin, bs, be);
  });
}

async function createBooking(req, res) {
  const { groundId, date, startTime, endTime } = req.body || {};
  if (!groundId || !date || !startTime || !endTime) {
    return res.status(400).json({ ok: false, message: 'groundId, date, startTime, endTime are required' });
  }

  const ground = await getGroundById(req, groundId);
  if (!ground) return res.status(404).json({ ok: false, message: 'Ground not found' });
  if (!ground.isActive) return res.status(400).json({ ok: false, message: 'Ground is inactive' });

  const conflicting = await listConflictingBookings(req, { groundId, date, startTime, endTime });
  if (conflicting.length > 0) return res.status(409).json({ ok: false, message: 'Slot already booked' });

  const { timeToMinutes, addMinutes } = require('../utils/time.utils');
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const hours = Math.max(1, Math.min(24, Math.round((endMin - startMin) / 60)));
  const amountPaise = hours * ground.pricePerHour * 100;

  const bookingData = {
    _id: newId(),
    userId: req.user.id,
    groundId,
    date,
    startTime,
    endTime,
    amountPaise,
    currency: 'INR',
    status: 'pending_payment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isDbConnected(req)) {
    const booking = await Booking.create(bookingData);
    return res.status(201).json({ ok: true, booking: { id: booking._id, ...booking.toObject() } });
  }

  memoryStore.bookings.push(bookingData);
  return res.status(201).json({ ok: true, booking: bookingData });
}

async function listMyBookings(req, res) {
  if (isDbConnected(req)) {
    const docs = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ ok: true, bookings: docs.map(b => ({ id: b._id, ...b.toObject() })) });
  }

  const bookings = memoryStore.bookings.filter(b => b.userId === req.user.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return res.json({ ok: true, bookings });
}

async function getBooking(req, res) {
  const { id } = req.params;
  let booking;
  if (isDbConnected(req)) {
    booking = await Booking.findById(id);
  } else {
    booking = memoryStore.bookings.find(b => b.id === id);
  }
  if (!booking) return res.status(404).json({ ok: false, message: 'Booking not found' });
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Not allowed' });
  }
  return res.json({ ok: true, booking: isDbConnected(req) ? { id: booking._id, ...booking.toObject() } : booking });
}

async function cancelBooking(req, res) {
  const { id } = req.params;
  let booking;
  if (isDbConnected(req)) {
    booking = await Booking.findById(id);
  } else {
    booking = memoryStore.bookings.find(b => b.id === id);
  }
  if (!booking) return res.status(404).json({ ok: false, message: 'Booking not found' });
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Not allowed' });
  }
  if (!['pending_payment', 'confirmed'].includes(booking.status)) {
    return res.status(409).json({ ok: false, message: `Cannot cancel booking in status ${booking.status}` });
  }

  if (isDbConnected(req)) {
    await Booking.findByIdAndUpdate(id, { status: 'cancelled', updatedAt: new Date().toISOString() });
    return res.json({ ok: true, message: 'Booking cancelled' });
  }

  booking.status = 'cancelled';
  booking.updatedAt = new Date().toISOString();
  return res.json({ ok: true, message: 'Booking cancelled' });
}

module.exports = {
  createBooking,
  listMyBookings,
  getBooking,
  cancelBooking
};
