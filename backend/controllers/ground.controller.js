const { memoryStore } = require('../store/memory.store');
const { computeSlots, timeToMinutes, intervalsOverlap } = require('../utils/time.utils');

async function getGroundById(req, groundId) {
  return memoryStore.grounds.find((g) => g.id === groundId) || null;
}

async function listGrounds(req, res) {
  const grounds = memoryStore.grounds.filter((g) => g.isActive !== false);
  return res.json({ ok: true, grounds });
}

async function getGround(req, res) {
  const { id } = req.params;
  const ground = memoryStore.grounds.find((g) => g.id === id);
  if (!ground || ground.isActive === false) {
    return res.status(404).json({ ok: false, message: 'Ground not found' });
  }
  return res.json({ ok: true, ground });
}

async function getAvailability(req, res) {
  const { id } = req.params;
  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, message: 'Valid date (YYYY-MM-DD) is required' });
  }

  const ground = memoryStore.grounds.find((g) => g.id === id);
  if (!ground || ground.isActive === false) {
    return res.status(404).json({ ok: false, message: 'Ground not found' });
  }

  const baseSlots = computeSlots(ground.openTime, ground.closeTime, ground.slotMinutes);

  const bookings = memoryStore.bookings.filter(
    (b) => b.groundId === id && b.date === String(date) && b.status !== 'cancelled'
  );

  const slots = baseSlots.map((s) => {
    const sStart = timeToMinutes(s.startTime);
    const sEnd = timeToMinutes(s.endTime);

    const isBooked = bookings.some((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return intervalsOverlap(sStart, sEnd, bStart, bEnd);
    });

    return {
      ...s,
      available: !isBooked
    };
  });

  return res.json({ ok: true, date: String(date), groundId: id, slots });
}

module.exports = {
  listGrounds,
  getGround,
  getAvailability
};
