const crypto = require('crypto');
const Razorpay = require('razorpay');

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function getPublicKeyId() {
  return process.env.RAZORPAY_KEY_ID || null;
}

async function createRazorpayOrder({ amountPaise, currency, receipt, notes }) {
  const client = getRazorpayClient();

  if (!client) {
    const mockId = `order_mock_${receipt}_${Date.now()}`;
    return {
      id: mockId,
      amount: amountPaise,
      currency,
      receipt,
      notes,
      status: 'created',
      isMock: true
    };
  }

  const order = await client.orders.create({
    amount: amountPaise,
    currency,
    receipt,
    notes
  });

  return order;
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return { ok: false, reason: 'RAZORPAY_KEY_SECRET not configured' };
  }

  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  const expected = hmac.digest('hex');

  return { ok: expected === signature, expected };
}

function verifyWebhookSignature({ rawBodyBuffer, signature }) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    return { ok: false, reason: 'RAZORPAY_WEBHOOK_SECRET not configured' };
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBodyBuffer).digest('hex');

  return { ok: expected === signature, expected };
}

module.exports = {
  getPublicKeyId,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
};
