const Ground = require('../models/Ground');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { memoryStore, newId } = require('../store/memory.store');

function isDbConnected(req) {
  return Boolean(req.app && req.app.locals && req.app.locals.dbConnected);
}

async function getStats(req, res) {
  if (isDbConnected(req)) {
    const [grounds, bookings, payments] = await Promise.all([
      Ground.countDocuments(),
      Booking.countDocuments(),
      Payment.countDocuments()
    ]);
    return res.json({ ok: true, stats: { grounds, bookings, payments } });
  }

  return res.json({
    ok: true,
    stats: {
      grounds: memoryStore.grounds.length,
      bookings: memoryStore.bookings.length,
      payments: memoryStore.payments.length
    }
  });
}

async function listGrounds(req, res) {
  if (isDbConnected(req)) {
    const grounds = await Ground.find({}).sort({ createdAt: -1 });
    return res.json({ ok: true, grounds: grounds.map(g => ({ id: g._id, ...g.toObject() })) });
  }

  return res.json({ ok: true, grounds: memoryStore.grounds });
}

async function createGround(req, res) {
  const {
    name,
    location,
    pricePerHour,
    images = [],
    amenities = [],
    openTime,
    closeTime,
    slotMinutes = 60,
    isActive = true
  } = req.body || {};

  if (!name || !location || typeof pricePerHour === 'undefined' || !openTime || !closeTime) {
    return res
      .status(400)
      .json({ ok: false, message: 'name, location, pricePerHour, openTime, closeTime are required' });
  }

  const groundData = {
    _id: newId(),
    name: String(name).trim(),
    location: String(location).trim(),
    pricePerHour: Number(pricePerHour),
    images: Array.isArray(images) ? images.map(String) : [],
    amenities: Array.isArray(amenities) ? amenities.map(String) : [],
    openTime: String(openTime),
    closeTime: String(closeTime),
    slotMinutes: Number(slotMinutes) || 60,
    isActive: Boolean(isActive),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isDbConnected(req)) {
    const doc = await Ground.create(groundData);
    return res.status(201).json({ ok: true, ground: { id: doc._id, ...doc.toObject() } });
  }

  memoryStore.grounds.push(groundData);
  return res.status(201).json({ ok: true, ground: groundData });
}

async function updateGround(req, res) {
  const { id } = req.params;
  const patch = req.body || {};

  const allowedFields = [
    'name',
    'location',
    'pricePerHour',
    'images',
    'amenities',
    'openTime',
    'closeTime',
    'slotMinutes',
    'isActive'
  ];

  const updates = {};
  for (const key of allowedFields) {
    if (typeof patch[key] !== 'undefined') updates[key] = patch[key];
  }

  if (isDbConnected(req)) {
    const doc = await Ground.findById(id);
    if (!doc) {
      return res.status(404).json({ ok: false, message: 'Ground not found' });
    }

    for (const [k, v] of Object.entries(updates)) {
      doc[k] = v;
    }
    doc.updatedAt = new Date().toISOString();
    await doc.save();
    return res.json({ ok: true, ground: { id: doc._id, ...doc.toObject() } });
  }

  const idx = memoryStore.grounds.findIndex(g => g.id === id);
  if (idx < 0) {
    return res.status(404).json({ ok: false, message: 'Ground not found' });
  }

  memoryStore.grounds[idx] = {
    ...memoryStore.grounds[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  return res.json({ ok: true, ground: memoryStore.grounds[idx] });
}

async function listBookings(req, res) {
  if (isDbConnected(req)) {
    const docs = await Booking.find({}).sort({ createdAt: -1 });
    return res.json({ ok: true, bookings: docs.map(b => ({ id: b._id, ...b.toObject() })) });
  }

  const bookings = [...memoryStore.bookings].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return res.json({ ok: true, bookings });
}

async function listPayments(req, res) {
  if (isDbConnected(req)) {
    const docs = await Payment.find({}).sort({ createdAt: -1 });
    return res.json({ ok: true, payments: docs.map(p => ({ id: p._id, ...p.toObject() })) });
  }

  const payments = [...memoryStore.payments].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return res.json({ ok: true, payments });
}

module.exports = {
  getStats,
  listGrounds,
  createGround,
  updateGround,
  listBookings,
  listPayments
};
