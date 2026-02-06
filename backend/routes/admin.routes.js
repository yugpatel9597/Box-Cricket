const express = require('express');

const {
  getStats,
  listGrounds,
  createGround,
  updateGround,
  listBookings,
  listPayments
} = require('../controllers/admin.controller');

const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, getStats);

router.get('/grounds', requireAuth, requireAdmin, listGrounds);
router.post('/grounds', requireAuth, requireAdmin, createGround);
router.put('/grounds/:id', requireAuth, requireAdmin, updateGround);

router.get('/bookings', requireAuth, requireAdmin, listBookings);
router.get('/payments', requireAuth, requireAdmin, listPayments);

module.exports = router;
