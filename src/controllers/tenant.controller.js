const prisma = require('../config/prisma');

const slugify = (value) => {
    return value
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-+|-+$)/g, '');
};

const getTenants = async (req, res) => {
    try {
        const tenants = await prisma.tenant.findMany({
            orderBy: { name: 'asc' }
        });

        const tenantIds = tenants.map(tenant => tenant.id);

        const [userCounts, openTicketCounts] = await Promise.all([
            prisma.tenantUser.groupBy({
                by: ['tenantId'],
                where: { tenantId: { in: tenantIds }, isActive: true },
                _count: true
            }),
            prisma.ticket.groupBy({
                by: ['tenantId'],
                where: { tenantId: { in: tenantIds }, status: { not: 'FINALIZADO' } },
                _count: true
            })
        ]);

        const userCountMap = {};
        userCounts.forEach(item => { userCountMap[item.tenantId] = item._count; });

        const openTicketMap = {};
        openTicketCounts.forEach(item => { openTicketMap[item.tenantId] = item._count; });

        return res.json({
            success: true,
            data: tenants.map(tenant => ({
                ...tenant,
                usersCount: userCountMap[tenant.id] || 0,
                openTickets: openTicketMap[tenant.id] || 0
            }))
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener empresas'
        });
    }
};

const getTenantById = async (req, res) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: Number(req.params.id) }
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Empresa no encontrada'
            });
        }

        return res.json({ success: true, data: tenant });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener la empresa'
        });
    }
};

const createTenant = async (req, res) => {
    try {
        const { name, slug, legalName, taxId, logoUrl, primaryColor } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la empresa es obligatorio'
            });
        }

        const normalizedSlug = slugify(slug || name);

        if (!normalizedSlug) {
            return res.status(400).json({
                success: false,
                message: 'No se pudo generar un identificador válido para la empresa'
            });
        }

        const existing = await prisma.tenant.findUnique({
            where: { slug: normalizedSlug }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una empresa con ese identificador'
            });
        }

        const tenant = await prisma.tenant.create({
            data: {
                name: name.trim(),
                slug: normalizedSlug,
                legalName: legalName || null,
                taxId: taxId || null,
                logoUrl: logoUrl || null,
                primaryColor: primaryColor || null
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Empresa creada correctamente',
            data: tenant
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear la empresa'
        });
    }
};

const updateTenant = async (req, res) => {
    try {
        const tenantId = Number(req.params.id);
        const { name, legalName, taxId, logoUrl, primaryColor } = req.body;

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Empresa no encontrada'
            });
        }

        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la empresa es obligatorio'
            });
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name: name.trim(),
                legalName: legalName !== undefined ? legalName : tenant.legalName,
                taxId: taxId !== undefined ? taxId : tenant.taxId,
                logoUrl: logoUrl !== undefined ? logoUrl : tenant.logoUrl,
                primaryColor: primaryColor !== undefined ? primaryColor : tenant.primaryColor
            }
        });

        return res.json({
            success: true,
            message: 'Empresa actualizada correctamente',
            data: updatedTenant
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la empresa'
        });
    }
};

const toggleTenantStatus = async (req, res) => {
    try {
        const tenantId = Number(req.params.id);
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El estado isActive es obligatorio'
            });
        }

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Empresa no encontrada'
            });
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { isActive: Boolean(isActive) }
        });

        return res.json({
            success: true,
            message: 'Estado de la empresa actualizado correctamente',
            data: updatedTenant
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado de la empresa'
        });
    }
};

const getTenantSummary = async (req, res) => {
    try {
        const tenantId = Number(req.params.id);

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Empresa no encontrada'
            });
        }

        const [usersCount, ticketsByStatus] = await Promise.all([
            prisma.tenantUser.count({ where: { tenantId, isActive: true } }),
            prisma.ticket.groupBy({ by: ['status'], where: { tenantId }, _count: true })
        ]);

        return res.json({
            success: true,
            data: {
                tenant,
                usersCount,
                ticketsByStatus
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el resumen de la empresa'
        });
    }
};

module.exports = {
    getTenants,
    getTenantById,
    createTenant,
    updateTenant,
    toggleTenantStatus,
    getTenantSummary
};
