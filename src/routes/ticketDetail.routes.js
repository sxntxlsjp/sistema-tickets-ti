const express = require('express');
const router = express.Router();

const { getTicketById } = require('../controllers/ticketDetail.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/:id', authenticateToken, getTicketById);

module.exports = router;