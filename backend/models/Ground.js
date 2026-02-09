const mongoose = require('mongoose');

const groundSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  images: [{ type: String }],
  amenities: [{ type: String }],
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true },
  slotMinutes: { type: Number, default: 60 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

module.exports = mongoose.model('Ground', groundSchema);
