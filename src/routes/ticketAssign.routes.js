const express = require('express');
const router = express.Router();

const {
    assignTicket
} = require('../controllers/ticketAssign.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

router.put(
    '/:id/assign',
    authenticateToken,
    authorizeRoles('ADMIN'),
    assignTicket
);

module.exports = router;