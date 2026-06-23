const express = require('express');
const router = express.Router();

const {
    uploadAttachment,
    getAttachments
} = require('../controllers/ticketAttachment.controller');

const { authenticateToken } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.post(
    '/:id/attachments',
    authenticateToken,
    upload.single('file'),
    uploadAttachment
);

router.get(
    '/:id/attachments',
    authenticateToken,
    getAttachments
);

module.exports = router;