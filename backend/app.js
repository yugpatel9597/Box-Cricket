require('dotenv').config();

const cors = require('cors');
const express = require('express');
 const path = require('path');

 const authRoutes = require('./routes/auth.routes');
 const groundRoutes = require('./routes/ground.routes');
 const bookingRoutes = require('./routes/booking.routes');
 const paymentRoutes = require('./routes/payment.routes');
 const adminRoutes = require('./routes/admin.routes');
 const { razorpayWebhookHandler } = require('./webhooks/razorpay.webhook');

const app = express();

app.use(cors());

// Razorpay requires the raw body to verify webhook signatures.
app.post(
  '/api/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  razorpayWebhookHandler
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    name: 'box-cricket',
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/grounds', groundRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

const frontendPagesPath = path.join(__dirname, '..', 'frontend', 'pages');
const frontendAssetsPath = path.join(__dirname, '..', 'frontend', 'assets');

app.use('/assets', express.static(frontendAssetsPath));
app.use(express.static(frontendPagesPath));

module.exports = app;
