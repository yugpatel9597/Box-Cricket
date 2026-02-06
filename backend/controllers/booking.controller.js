const { memoryStore, newId } = require('../store/memory.store');
const { timeToMinutes, addMinutes, intervalsOverlap } = require('../utils/time.utils');

async function getGroundById(req, groundId) {
  return memoryStore.grounds.find((g) => g.id === groundId) || null;
}

async function listConflictingBookings(req, { groundId, date, startTime, endTime }) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || startMin >= endMin) {
    return [];
  }

  return memoryStore.bookings.filter((b) => {
    if (b.groundId !== groundId) return false;
    if (b.date !== date) return false;
    if (b.status === 'cancelled') return false;
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    return intervalsOverlap(startMin, endMin, bStart, bEnd);
  });
}

async function createBooking(req, res) {
  const { groundId, date, startTime, hours } = req.body || {};

  if (!groundId || !date || !startTime) {
    return res
      .status(400)
      .json({ ok: false, message: 'groundId, date (YYYY-MM-DD) and startTime (HH:mm) are required' });
  }

  const ground = await getGroundById(req, String(groundId));
  if (!ground || ground.isActive === false) {
    return res.status(404).json({ ok: false, message: 'Ground not found' });
  }

  const hrsRaw = Number(hours || 1);
  const hrs = Number.isFinite(hrsRaw) ? Math.max(1, Math.round(hrsRaw)) : 1;
  const endTime = addMinutes(String(startTime), hrs * 60);
  if (!endTime) {
    return res.status(400).json({ ok: false, message: 'Invalid startTime' });
  }

  const open = timeToMinutes(ground.openTime);
  const close = ground.closeTime === '24:00' ? 24 * 60 : timeToMinutes(ground.closeTime);
  const startMin = timeToMinutes(String(startTime));
  const endMin = timeToMinutes(endTime);

  if (startMin < open || endMin > close) {
    return res.status(400).json({ ok: false, message: 'Selected time is outside ground working hours' });
  }

  const conflicts = await listConflictingBookings(req, {
    groundId: String(groundId),
    date: String(date),
    startTime: String(startTime),
    endTime
  });

  if (conflicts.length > 0) {
    return res.status(409).json({ ok: false, message: 'Slot not available' });
  }

  const amountPaise = Math.round(Number(ground.pricePerHour) * hrs * 100);

  const booking = {
    id: newId(),
    userId: req.user.id,
    groundId: String(groundId),
    date: String(date),
    startTime: String(startTime),
    endTime,
    hours: hrs,
    amountPaise,
    currency: 'INR',
    status: 'pending_payment',
    razorpayOrderId: null,
    razorpayPaymentId: null,
    cancelledAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  memoryStore.bookings.push(booking);

  return res.json({ ok: true, booking });
}

async function getBookingById(req, res) {
  const { id } = req.params;

  const booking = memoryStore.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ ok: false, message: 'Booking not found' });
  }

  const isOwner = booking.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ ok: false, message: 'Not allowed' });
  }

  return res.json({ ok: true, booking });
}

async function listMyBookings(req, res) {
  const bookings = memoryStore.bookings
    .filter((b) => b.userId === req.user.id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return res.json({ ok: true, bookings });
}

async function cancelBooking(req, res) {
  const { id } = req.params;

  const booking = memoryStore.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ ok: false, message: 'Booking not found' });
  }

  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Not allowed' });
  }

  if (booking.status === 'cancelled') {
    return res.json({ ok: true, booking });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  booking.updatedAt = new Date().toISOString();

  return res.json({ ok: true, booking });
}

module.exports = {
  createBooking,
  getBookingById,
  listMyBookings,
  cancelBooking
};
