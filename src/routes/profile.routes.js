const express = require('express');
const router = express.Router();

const {
    uploadProfileImage,
    changeMyPassword
} = require('../controllers/profile.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

const uploadProfile =
    require('../middlewares/uploadProfile.middleware');

router.post(
    '/photo',
    authenticateToken,
    uploadProfile.single('photo'),
    uploadProfileImage
);

router.put(
    '/change-password',
    authenticateToken,
    changeMyPassword
);

module.exports = router;