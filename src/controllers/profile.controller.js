const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const path = require('path');
const storageService = require('../services/storage.service');

const PROFILE_IMAGES_BUCKET = process.env.SUPABASE_PROFILE_IMAGES_BUCKET;

const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'No se adjuntó ninguna imagen'
            });
        }

        // profileImage es un atributo del usuario, no del tenant activo:
        // un mismo usuario puede pertenecer a varias empresas y comparte una sola foto.
        const extension = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const storageKey = `user-${req.user.id}${extension}`;

        await storageService.upload(
            PROFILE_IMAGES_BUCKET,
            storageKey,
            req.file.buffer,
            req.file.mimetype
        );

        const user = await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: {
                profileImage: storageKey
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                jobTitle: true,
                phone: true,
                profileImage: true
            }
        });

        return res.json({
            message: 'Foto de perfil actualizada correctamente',
            user
        });

    } catch (error) {
        console.error('[uploadProfileImage]', error.message);

        return res.status(500).json({
            message: 'Error al actualizar foto de perfil'
        });
    }
};

const changeMyPassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'La contraseña actual y la nueva contraseña son obligatorias'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        });

        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                message: 'La contraseña actual no es correcta'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: {
                passwordHash: hashedPassword
            }
        });

        return res.json({
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al cambiar contraseña'
        });
    }
};
module.exports = {
    uploadProfileImage,
    changeMyPassword
};