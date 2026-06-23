const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

const getSupportUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ['SUPPORT', 'ADMIN']
                },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                jobTitle: true,
                email: true,
                profileImage: true,
                role: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return res.json(users);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al obtener usuarios de soporte'
        });
    }
};
const createUser = async (req, res) => {
    try {
        const {
            name,
            department,
            jobTitle,
            email,
            phone,
            password,
            role
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Nombre, correo y contraseña son obligatorios'
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'Ya existe un usuario con este correo'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                department,
                jobTitle,
                email,
                phone,
                passwordHash: hashedPassword,
                role: role || 'USER'
            },
            select: {
                id: true,
                name: true,
                department: true,
                jobTitle: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        return res.status(201).json({
            message: 'Usuario creado correctamente',
            user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al crear usuario'
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                department: true,
                jobTitle: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                profileImage: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.json(users);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al obtener usuarios'
        });
    }
};
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            department,
            jobTitle,
            email,
            phone,
            role,
            isActive
        } = req.body;

        const user = await prisma.user.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                department,
                jobTitle,
                email,
                phone,
                role,
                isActive
            },
            select: {
                id: true,
                name: true,
                department: true,
                jobTitle: true,
                email: true,
                phone: true,
                role: true,
                isActive: true
            }
        });

        return res.json({
            message: 'Usuario actualizado correctamente',
            user
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al actualizar usuario'
        });
    }
};

const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                message: 'La nueva contraseña es obligatoria'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: {
                id: Number(id)
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
            message: 'Error al actualizar contraseña'
        });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) === req.user.id) {
            return res.status(400).json({
                message: 'No puedes desactivar tu propia cuenta'
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: Number(id)
            },
            data: {
                isActive: !user.isActive
            },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true
            }
        });

        return res.json({
            message: updatedUser.isActive
                ? 'Usuario activado correctamente'
                : 'Usuario desactivado correctamente',
            user: updatedUser
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al cambiar estado del usuario'
        });
    }
};
module.exports = {
    getSupportUsers,
    createUser,
    getAllUsers,
    updateUser,
    resetUserPassword,
    toggleUserStatus
};