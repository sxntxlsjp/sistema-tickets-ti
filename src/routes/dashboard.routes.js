const express = require('express');
const router = express.Router();

const {
    getDashboardSummary,
    getMyAdminAlerts
} = require('../controllers/dashboard.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

router.get(
    '/summary',
    authenticateToken,
    authorizeRoles('ADMIN'),
    getDashboardSummary
);
router.get(
    '/my-alerts',
    authenticateToken,
    authorizeRoles('ADMIN'),
    getMyAdminAlerts
);
module.exports = router;