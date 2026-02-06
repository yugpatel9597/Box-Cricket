const express = require('express');

const { listGrounds, getGround, getAvailability } = require('../controllers/ground.controller');

const router = express.Router();

router.get('/', listGrounds);
router.get('/:id', getGround);
router.get('/:id/availability', getAvailability);

module.exports = router;
