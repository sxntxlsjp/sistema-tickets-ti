const express = require('express');
const router = express.Router();

const { updateTicketStatus } = require('../controllers/ticketStatus.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

router.put(
    '/:id/status',
    authenticateToken,
    authorizeRoles('ADMIN', 'SUPPORT'),
    updateTicketStatus
);

module.exports = router;