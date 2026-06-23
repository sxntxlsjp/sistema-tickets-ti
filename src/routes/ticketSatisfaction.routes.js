const express = require('express');
const router = express.Router();

const {
    createSatisfaction
} = require('../controllers/ticketSatisfaction.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

router.post(
    '/:ticketId/satisfaction',
    authenticateToken,
    createSatisfaction
);

module.exports = router;