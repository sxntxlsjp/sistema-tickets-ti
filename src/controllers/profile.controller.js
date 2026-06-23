const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'No se adjuntó ninguna imagen'
            });
        }

        const imagePath = `/uploads/profiles/${req.file.filename}`;

        const user = await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: {
                profileImage: imagePath
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
        console.error(error);

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