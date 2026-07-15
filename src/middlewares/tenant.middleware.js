const prisma = require('../config/prisma');

const resolveTenant = async (req, res, next) => {
    try {
        const headerTenantId = req.headers['x-tenant-id'];

        if (!headerTenantId) {
            return res.status(400).json({
                message: 'Empresa no especificada'
            });
        }

        const tenantId = Number(headerTenantId);

        if (!Number.isInteger(tenantId) || tenantId <= 0) {
            return res.status(400).json({
                message: 'Empresa inválida'
            });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant || !tenant.isActive) {
            return res.status(403).json({
                message: 'Empresa no disponible'
            });
        }

        if (req.user.isSuperAdmin) {
            req.tenant = tenant;
            req.tenantId = tenant.id;
            req.tenantMembership = null;
            return next();
        }

        const membership = await prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId: req.user.id
                }
            }
        });

        if (!membership || !membership.isActive) {
            return res.status(403).json({
                message: 'No tienes acceso a esta empresa'
            });
        }

        req.tenant = tenant;
        req.tenantId = tenant.id;
        req.tenantMembership = membership;
        next();

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al resolver la empresa activa'
        });
    }
};

const authorizeTenantRoles = (...roles) => {
    return (req, res, next) => {
        if (req.user.isSuperAdmin) {
            return next();
        }

        if (!req.tenantMembership || !roles.includes(req.tenantMembership.role)) {
            return res.status(403).json({
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.user.isSuperAdmin) {
        return res.status(403).json({
            message: 'No tienes permisos para realizar esta acción'
        });
    }

    next();
};

module.exports = {
    resolveTenant,
    authorizeTenantRoles,
    requireSuperAdmin
};
