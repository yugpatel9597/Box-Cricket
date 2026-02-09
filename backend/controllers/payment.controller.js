const { memoryStore, newId } = require('../store/memory.store');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const {
  getPublicKeyId,
  createRazorpayOrder,
  verifyPaymentSignature
} = require('../services/razorpay.service');

function isDbConnected(req) {
  return Boolean(req.app && req.app.locals && req.app.locals.dbConnected);
}

async function getConfig(req, res) {
  return res.json({ ok: true, keyId: getPublicKeyId() });
}

async function createOrder(req, res) {
  const { bookingId } = req.body || {};

  if (!bookingId) {
    return res.status(400).json({ ok: false, message: 'bookingId is required' });
  }

  let booking;
  if (isDbConnected(req)) {
    const Booking = require('../models/Booking');
    booking = await Booking.findById(bookingId);
  } else {
    booking = memoryStore.bookings.find(b => b.id === String(bookingId));
  }

  if (!booking) {
    return res.status(404).json({ ok: false, message: 'Booking not found' });
  }

  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Not allowed' });
  }

  if (booking.status !== 'pending_payment') {
    return res.status(409).json({ ok: false, message: `Booking is ${booking.status}` });
  }

  const order = await createRazorpayOrder({
    amountPaise: booking.amountPaise,
    currency: booking.currency || 'INR',
    receipt: booking.id,
    notes: {
      bookingId: booking.id,
      groundId: booking.groundId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime
    }
  });

  if (isDbConnected(req)) {
    await Booking.findByIdAndUpdate(booking.id, { razorpayOrderId: order.id, updatedAt: new Date().toISOString() });
  } else {
    booking.razorpayOrderId = order.id;
    booking.updatedAt = new Date().toISOString();
  }

  const paymentData = {
    _id: newId(),
    bookingId: booking.id,
    amountPaise: booking.amountPaise,
    currency: booking.currency || 'INR',
    status: 'created',
    razorpayOrderId: order.id,
    razorpayPaymentId: null,
    razorpaySignature: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isDbConnected(req)) {
    await Payment.create(paymentData);
  } else {
    memoryStore.payments.push(paymentData);
  }

  return res.json({ ok: true, keyId: getPublicKeyId(), order });
}

async function verifyPayment(req, res) {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ ok: false, message: 'Missing payment verification fields' });
  }

  const verification = verifyPaymentSignature({
    orderId: String(razorpay_order_id),
    paymentId: String(razorpay_payment_id),
    signature: String(razorpay_signature)
  });

  if (!verification.ok) {
    const paymentData = {
      _id: newId(),
      bookingId: String(bookingId),
      amountPaise: 0,
      currency: 'INR',
      status: 'failed',
      razorpayOrderId: String(razorpay_order_id),
      razorpayPaymentId: String(razorpay_payment_id),
      razorpaySignature: String(razorpay_signature),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isDbConnected(req)) {
      await Payment.create(paymentData);
    } else {
      memoryStore.payments.push(paymentData);
    }

    return res.status(400).json({ ok: false, message: 'Payment signature verification failed' });
  }

  let booking;
  if (isDbConnected(req)) {
    const Booking = require('../models/Booking');
    booking = await Booking.findById(bookingId);
  } else {
    booking = memoryStore.bookings.find(b => b.id === String(bookingId));
  }

  if (!booking) {
    return res.status(404).json({ ok: false, message: 'Booking not found' });
  }

  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Not allowed' });
  }

  if (booking.razorpayOrderId && booking.razorpayOrderId !== String(razorpay_order_id)) {
    return res.status(409).json({ ok: false, message: 'Order ID mismatch' });
  }

  if (isDbConnected(req)) {
    await Booking.findByIdAndUpdate(booking.id, {
      status: 'confirmed',
      razorpayOrderId: String(razorpay_order_id),
      razorpayPaymentId: String(razorpay_payment_id),
      updatedAt: new Date().toISOString()
    });
  } else {
    booking.status = 'confirmed';
    booking.razorpayOrderId = String(razorpay_order_id);
    booking.razorpayPaymentId = String(razorpay_payment_id);
    booking.updatedAt = new Date().toISOString();
  }

  const paymentData = {
    _id: newId(),
    bookingId: booking.id,
    amountPaise: booking.amountPaise,
    currency: booking.currency || 'INR',
    status: 'verified',
    razorpayOrderId: String(razorpay_order_id),
    razorpayPaymentId: String(razorpay_payment_id),
    razorpaySignature: String(razorpay_signature),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isDbConnected(req)) {
    await Payment.create(paymentData);
  } else {
    memoryStore.payments.push(paymentData);
  }

  return res.json({ ok: true, booking });
}

module.exports = {
  getConfig,
  createOrder,
  verifyPayment
};
