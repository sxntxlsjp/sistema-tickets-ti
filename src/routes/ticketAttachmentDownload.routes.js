const express = require('express');
const router = express.Router();

const {
    downloadAttachment
} = require('../controllers/ticketAttachment.controller');

const { authenticateToken } = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');

router.get(
    '/:id/download',
    authenticateToken,
    resolveTenant,
    downloadAttachment
);

module.exports = router;
