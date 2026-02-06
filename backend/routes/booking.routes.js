const express = require('express');

const {
  createBooking,
  getBookingById,
  listMyBookings,
  cancelBooking
} = require('../controllers/booking.controller');

const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', requireAuth, createBooking);
router.get('/mine', requireAuth, listMyBookings);
router.get('/:id', requireAuth, getBookingById);
router.post('/:id/cancel', requireAuth, cancelBooking);

module.exports = router;
