const express = require('express');
const router = express.Router();

const { getTicketById } = require('../controllers/ticketDetail.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');

router.get('/:id', authenticateToken, resolveTenant, getTicketById);

module.exports = router;