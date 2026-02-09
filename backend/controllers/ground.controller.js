const Ground = require('../models/Ground');
const { memoryStore } = require('../store/memory.store');

function isDbConnected(req) {
  return Boolean(req.app && req.app.locals && req.app.locals.dbConnected);
}

async function listGrounds(req, res) {
  if (isDbConnected(req)) {
    const grounds = await Ground.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json({ ok: true, grounds: grounds.map(g => ({ id: g._id, ...g.toObject() })) });
  }
  return res.json({ ok: true, grounds: memoryStore.grounds.filter(g => g.isActive) });
}

async function getGroundById(req, groundId) {
  if (isDbConnected(req)) {
    return await Ground.findById(groundId);
  }
  return memoryStore.grounds.find(g => g.id === groundId) || null;
}

async function getGround(req, res) {
  const { id } = req.params;
  const ground = await getGroundById(req, id);
  if (!ground) return res.status(404).json({ ok: false, message: 'Ground not found' });
  return res.json({ ok: true, ground: isDbConnected(req) ? { id: ground._id, ...ground.toObject() } : ground });
}

async function getAvailability(req, res) {
  const { id } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ ok: false, message: 'date query param required' });

  const ground = await getGroundById(req, id);
  if (!ground) return res.status(404).json({ ok: false, message: 'Ground not found' });

  const { timeToMinutes, addMinutes, intervalsOverlap } = require('../utils/time.utils');
  const openMin = timeToMinutes(ground.openTime);
  const closeMin = timeToMinutes(ground.closeTime);

  let bookings = [];
  if (isDbConnected(req)) {
    const Booking = require('../models/Booking');
    const docs = await Booking.find({ groundId: id, date, status: { $in: ['confirmed', 'pending_payment'] } });
    bookings = docs;
  } else {
    bookings = memoryStore.bookings.filter(b => b.groundId === id && b.date === date && ['confirmed', 'pending_payment'].includes(b.status));
  }

  const bookedSlots = bookings.map(b => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }));
  const allSlots = [];
  for (let t = openMin; t + ground.slotMinutes <= closeMin; t += ground.slotMinutes) {
    const slot = { start: t, end: t + ground.slotMinutes };
    if (!bookedSlots.some(bs => intervalsOverlap(slot.start, slot.end, bs.start, bs.end))) {
      allSlots.push(slot);
    }
  }

  const slots = allSlots.map(s => ({
    startTime: addMinutes('00:00', s.start),
    endTime: addMinutes('00:00', s.end),
    available: true
  }));

  return res.json({ ok: true, date, slots });
}

module.exports = { listGrounds, getGround, getAvailability };
