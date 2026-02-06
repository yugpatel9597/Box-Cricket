const express = require('express');

const { getConfig, createOrder, verifyPayment } = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/config', getConfig);
router.post('/create-order', requireAuth, createOrder);
router.post('/verify', requireAuth, verifyPayment);

module.exports = router;
