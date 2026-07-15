const prisma = require('../config/prisma');

const getTenantsForUser = async (user) => {
    const memberships = await prisma.tenantUser.findMany({
        where: {
            userId: user.id,
            isActive: true,
            tenant: { isActive: true }
        },
        include: { tenant: true }
    });

    const roleByTenantId = {};
    memberships.forEach(membership => {
        roleByTenantId[membership.tenantId] = membership.role;
    });

    const tenants = user.isSuperAdmin
        ? await prisma.tenant.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        })
        : memberships
            .map(membership => membership.tenant)
            .sort((a, b) => a.name.localeCompare(b.name));

    const tenantIds = tenants.map(tenant => tenant.id);

    const openCounts = tenantIds.length > 0
        ? await prisma.ticket.groupBy({
            by: ['tenantId'],
            where: {
                tenantId: { in: tenantIds },
                status: { not: 'FINALIZADO' }
            },
            _count: true
        })
        : [];

    const openMap = {};
    openCounts.forEach(item => {
        openMap[item.tenantId] = item._count;
    });

    return tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        role: roleByTenantId[tenant.id] || 'SUPER_ADMIN',
        openTickets: openMap[tenant.id] || 0
    }));
};

module.exports = {
    getTenantsForUser
};
