const express = require('express');
const router = express.Router();

const {
    createTicket,
    takeTicket
} = require('../controllers/ticket.controller');
const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

router.post('/', authenticateToken, createTicket);
router.put(
    '/:id/take',
    authenticateToken,
    authorizeRoles('ADMIN'),
    takeTicket
);
module.exports = router;