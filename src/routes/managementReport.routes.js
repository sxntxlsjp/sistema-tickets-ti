const express = require('express');
const router = express.Router();

const {
    generateManagementReport
} = require('../controllers/managementReport.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

router.get(
    '/management-report',
    authenticateToken,
    authorizeRoles('ADMIN'),
    generateManagementReport
);

module.exports = router;