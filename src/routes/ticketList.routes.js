const express = require('express');
const router = express.Router();

const {
    getMyTickets,
    getAllTickets
} = require('../controllers/ticketList.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

router.get('/my', authenticateToken, getMyTickets);

router.get(
    '/',
    authenticateToken,
    authorizeRoles('ADMIN'),
    getAllTickets
);

module.exports = router;