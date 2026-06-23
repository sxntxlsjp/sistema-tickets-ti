const express = require('express');
const router = express.Router();

const { getTicketTypes } = require('../controllers/ticketType.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/', authenticateToken, getTicketTypes);

module.exports = router;