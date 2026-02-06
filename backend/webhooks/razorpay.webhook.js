const { verifyWebhookSignature } = require('../services/razorpay.service');

async function razorpayWebhookHandler(req, res) {
  const signature = req.header('x-razorpay-signature');
  const rawBodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');

  const verification = verifyWebhookSignature({ rawBodyBuffer, signature });

  if (!verification.ok) {
    return res.status(400).json({ ok: false, message: 'Invalid webhook signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBodyBuffer.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ ok: false, message: 'Invalid JSON payload' });
  }

  // Placeholder: In production, use webhook events to reconcile payments/refunds.
  // For example: payment.captured, payment.failed, refund.processed.
  const event = payload && payload.event ? payload.event : 'unknown';
  console.log(`[razorpay-webhook] event=${event}`);

  return res.json({ ok: true });
}

module.exports = { razorpayWebhookHandler };
