const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  groundId: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  amountPaise: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending_payment', 'confirmed', 'cancelled'], default: 'pending_payment' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

module.exports = mongoose.model('Booking', bookingSchema);
