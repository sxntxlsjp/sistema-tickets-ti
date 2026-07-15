const express = require('express');
const router = express.Router();

const {
    createSatisfaction
} = require('../controllers/ticketSatisfaction.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');

router.post(
    '/:ticketId/satisfaction',
    authenticateToken,
    resolveTenant,
    createSatisfaction
);

module.exports = router;