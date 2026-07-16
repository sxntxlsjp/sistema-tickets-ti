const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

const TENANT_ROLES = ['TENANT_ADMIN', 'AGENT', 'USER'];

// Compatibilidad temporal de entrada (Sprint 19): el Frontend legado y algunos
// clientes antiguos aún pueden enviar 'ADMIN'. Se normaliza a 'TENANT_ADMIN',
// el único rol administrativo válido a nivel de empresa (TenantUser.role).
// 'SUPER_ADMIN' e 'isSuperAdmin' nunca se aceptan por esta vía: ver User.isSuperAdmin.
const normalizeTenantRole = (role) => (role === 'ADMIN' ? 'TENANT_ADMIN' : role);

const getSupportUsers = async (req, res) => {
    try {
        const memberships = await prisma.tenantUser.findMany({
            where: {
                tenantId: req.tenantId,
                isActive: true,
                role: { in: ['TENANT_ADMIN', 'AGENT'] },
                user: { isActive: true }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        jobTitle: true,
                        email: true,
                        profileImage: true
                    }
                }
            },
            orderBy: {
                user: { name: 'asc' }
            }
        });

        const users = memberships.map(membership => ({
            id: membership.user.id,
            name: membership.user.name,
            jobTitle: membership.user.jobTitle,
            email: membership.user.email,
            profileImage: membership.user.profileImage,
            role: membership.role
        }));

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

        let tenantRole = 'USER';

        if (role !== undefined) {
            const normalizedRole = normalizeTenantRole(role);

            if (!TENANT_ROLES.includes(normalizedRole)) {
                return res.status(400).json({
                    message: 'Rol inválido'
                });
            }

            tenantRole = normalizedRole;
        }

        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            const existingMembership = await prisma.tenantUser.findUnique({
                where: {
                    tenantId_userId: {
                        tenantId: req.tenantId,
                        userId: user.id
                    }
                }
            });

            if (existingMembership) {
                return res.status(400).json({
                    message: 'Este usuario ya pertenece a esta empresa'
                });
            }
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);

            user = await prisma.user.create({
                data: {
                    name,
                    department,
                    jobTitle,
                    email,
                    phone,
                    passwordHash: hashedPassword,
                    role: 'USER'
                }
            });
        }

        await prisma.tenantUser.create({
            data: {
                tenantId: req.tenantId,
                userId: user.id,
                role: tenantRole,
                isActive: true
            }
        });

        return res.status(201).json({
            message: 'Usuario creado correctamente',
            user: {
                id: user.id,
                name: user.name,
                department: user.department,
                jobTitle: user.jobTitle,
                email: user.email,
                phone: user.phone,
                role: tenantRole,
                isActive: true,
                createdAt: user.createdAt
            }
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
        const memberships = await prisma.tenantUser.findMany({
            where: {
                tenantId: req.tenantId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        department: true,
                        jobTitle: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const users = memberships.map(membership => ({
            id: membership.user.id,
            name: membership.user.name,
            department: membership.user.department,
            jobTitle: membership.user.jobTitle,
            email: membership.user.email,
            phone: membership.user.phone,
            role: membership.role,
            isActive: membership.isActive,
            profileImage: membership.user.profileImage,
            createdAt: membership.user.createdAt
        }));

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
        const userId = Number(id);

        const {
            name,
            department,
            jobTitle,
            email,
            phone,
            role,
            isActive
        } = req.body;

        const membership = await prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId: req.tenantId,
                    userId
                }
            }
        });

        if (!membership) {
            return res.status(404).json({
                message: 'Usuario no encontrado en esta empresa'
            });
        }

        let normalizedRole = membership.role;

        if (role !== undefined) {
            normalizedRole = normalizeTenantRole(role);

            if (!TENANT_ROLES.includes(normalizedRole)) {
                return res.status(400).json({
                    message: 'Rol inválido'
                });
            }
        }

        // Identidad global (nombre, correo) solo la puede modificar un Super Administrador.
        // Un TENANT_ADMIN solo administra datos de contexto laboral dentro de su empresa.
        const globalIdentityData = req.user.isSuperAdmin
            ? { name, email }
            : {};

        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                ...globalIdentityData,
                department,
                jobTitle,
                phone
            },
            select: {
                id: true,
                name: true,
                department: true,
                jobTitle: true,
                email: true,
                phone: true
            }
        });

        const updatedMembership = await prisma.tenantUser.update({
            where: {
                id: membership.id
            },
            data: {
                role: normalizedRole,
                isActive: isActive !== undefined ? Boolean(isActive) : membership.isActive
            }
        });

        return res.json({
            message: 'Usuario actualizado correctamente',
            user: {
                ...updatedUser,
                role: updatedMembership.role,
                isActive: updatedMembership.isActive
            }
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
        const userId = Number(id);
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                message: 'La nueva contraseña es obligatoria'
            });
        }

        const membership = await prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId: req.tenantId,
                    userId
                }
            }
        });

        if (!membership) {
            return res.status(404).json({
                message: 'Usuario no encontrado en esta empresa'
            });
        }

        // La contraseña es identidad global (compartida entre empresas si el usuario
        // pertenece a varias). Un TENANT_ADMIN solo puede resetearla si el usuario
        // es exclusivo de su empresa; si pertenece a otras, solo el Super Administrador puede.
        if (!req.user.isSuperAdmin) {
            const membershipCount = await prisma.tenantUser.count({
                where: { userId, isActive: true }
            });

            if (membershipCount > 1) {
                return res.status(403).json({
                    message: 'Este usuario pertenece a varias empresas; solo un Super Administrador puede restablecer su contraseña'
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: {
                id: userId
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
        const userId = Number(id);

        if (userId === req.user.id) {
            return res.status(400).json({
                message: 'No puedes desactivar tu propia cuenta'
            });
        }

        const membership = await prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId: req.tenantId,
                    userId
                }
            }
        });

        if (!membership) {
            return res.status(404).json({
                message: 'Usuario no encontrado en esta empresa'
            });
        }

        const updatedMembership = await prisma.tenantUser.update({
            where: {
                id: membership.id
            },
            data: {
                isActive: !membership.isActive
            }
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true }
        });

        return res.json({
            message: updatedMembership.isActive
                ? 'Usuario activado correctamente'
                : 'Usuario desactivado correctamente',
            user: {
                ...user,
                isActive: updatedMembership.isActive
            }
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
