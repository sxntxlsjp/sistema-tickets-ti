const prisma = require('../config/prisma');
const {
    getDateRange
} = require('../utils/dateRange.util');

const SLA_DUE_SOON_MINUTES = 60;

const getDashboardSummary = async (req, res) => {
    try {
        const range =
            req.query.range || 'all';

        const startDate =
            getDateRange(range);

        const dateFilter = {
            tenantId: req.tenantId,
            ...(startDate ? { createdAt: { gte: startDate } } : {})
        };

        const satisfactionFilter = {
            ticket: { tenantId: req.tenantId },
            ...(startDate ? { createdAt: { gte: startDate } } : {})
        };

        const now = new Date();

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const [
            totalTickets,
            openTickets,
            pendingTickets,
            closedTickets,
            withoutPriorityTickets,
            createdToday,
            createdThisWeek,
            closedThisWeek,
            ticketsByStatus,
            ticketsByPriorityRaw,
            ticketsByTypeRaw,
            ticketsBySubtypeRaw,
            ticketsByCountryRaw,
            ticketsByAssigneeRaw,
            priorities,
            types,
            subtypes,
            countries,
            users,
            satisfactionStats,
            latestTickets,
            latestSatisfactions,
            slaTickets,
            overdueTicketsList
        ] = await Promise.all([
            prisma.ticket.count({ where: dateFilter }),
            prisma.ticket.count({ where: { ...dateFilter, status: 'EN_REVISION' } }),
            prisma.ticket.count({ where: { ...dateFilter, status: 'PENDIENTE' } }),
            prisma.ticket.count({ where: { ...dateFilter, status: 'FINALIZADO' } }),
            prisma.ticket.count({ where: { ...dateFilter, priorityId: null } }),
            prisma.ticket.count({ where: { tenantId: req.tenantId, createdAt: { gte: startOfToday } } }),
            prisma.ticket.count({ where: { tenantId: req.tenantId, createdAt: { gte: startOfWeek } } }),
            prisma.ticket.count({ where: { tenantId: req.tenantId, status: 'FINALIZADO', closedAt: { gte: startOfWeek } } }),
            prisma.ticket.groupBy({ by: ['status'], where: dateFilter, _count: true }),
            prisma.ticket.groupBy({ by: ['priorityId'], where: dateFilter, _count: true }),
            prisma.ticket.groupBy({ by: ['typeId'], where: dateFilter, _count: true }),
            prisma.ticket.groupBy({ by: ['ticketSubtypeId'], where: dateFilter, _count: true }),
            prisma.ticket.groupBy({ by: ['countryId'], where: dateFilter, _count: true }),
            prisma.ticket.groupBy({
                by: ['assignedTo'],
                where: { ...dateFilter, status: { not: 'FINALIZADO' } },
                _count: true
            }),
            prisma.ticketPriority.findMany({ where: { tenantId: req.tenantId }, select: { id: true, name: true, color: true } }),
            prisma.ticketType.findMany({ where: { tenantId: req.tenantId }, select: { id: true, name: true } }),
            prisma.ticketSubtype.findMany({ where: { tenantId: req.tenantId }, select: { id: true, name: true } }),
            prisma.country.findMany({ select: { id: true, name: true, flagEmoji: true } }),
            prisma.user.findMany({
                where: { tenantMemberships: { some: { tenantId: req.tenantId } } },
                select: { id: true, name: true }
            }),
            prisma.ticketSatisfaction.aggregate({
                where: satisfactionFilter,
                _avg: { rating: true },
                _count: { rating: true }
            }),
            prisma.ticket.findMany({
                where: dateFilter,
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    requester: { select: { name: true, department: true } },
                    type: { select: { name: true } },
                    priority: { select: { name: true, color: true } },
                    country: { select: { name: true, flagEmoji: true } }
                }
            }),
            prisma.ticketSatisfaction.findMany({
                where: satisfactionFilter,
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                    ticket: { select: { ticketNumber: true, subject: true } }
                }
            }),
            prisma.ticket.findMany({
                where: dateFilter,
                select: {
                    status: true,
                    priorityId: true,
                    slaDueAt: true,
                    createdAt: true,
                    closedAt: true
                }
            }),
            prisma.ticket.findMany({
                where: {
                    ...dateFilter,
                    status: { not: 'FINALIZADO' },
                    priorityId: { not: null },
                    slaDueAt: { lt: now }
                },
                take: 5,
                orderBy: { slaDueAt: 'asc' },
                include: {
                    priority: { select: { name: true, color: true } },
                    assignee: { select: { name: true } }
                }
            })
        ]);

        const priorityName = (id) => priorities.find(p => p.id === id)?.name || 'Sin prioridad';
        const priorityColor = (id) => priorities.find(p => p.id === id)?.color || '#94A3B8';
        const typeName = (id) => types.find(t => t.id === id)?.name || 'Sin tipo';
        const subtypeName = (id) => subtypes.find(s => s.id === id)?.name || 'Sin servicio';
        const countryName = (id) => countries.find(c => c.id === id)?.name || 'Sin país';
        const countryFlag = (id) => countries.find(c => c.id === id)?.flagEmoji || '';
        const userName = (id) => users.find(u => u.id === id)?.name || 'Sin asignar';

        const ticketsByPriority = ticketsByPriorityRaw.map(item => ({
            priorityId: item.priorityId,
            priorityName: item.priorityId ? priorityName(item.priorityId) : 'Sin prioridad',
            color: item.priorityId ? priorityColor(item.priorityId) : '#94A3B8',
            total: item._count
        }));

        const ticketsByType = ticketsByTypeRaw.map(item => ({
            typeId: item.typeId,
            typeName: typeName(item.typeId),
            total: item._count
        }));

        const ticketsBySubtype = ticketsBySubtypeRaw.map(item => ({
            subtypeId: item.ticketSubtypeId,
            subtypeName: item.ticketSubtypeId ? subtypeName(item.ticketSubtypeId) : 'Sin servicio',
            total: item._count
        }));

        const ticketsByCountry = ticketsByCountryRaw.map(item => ({
            countryId: item.countryId,
            countryName: item.countryId ? countryName(item.countryId) : 'Sin país',
            flagEmoji: item.countryId ? countryFlag(item.countryId) : '',
            total: item._count
        }));

        const ticketsByAssignee = ticketsByAssigneeRaw
            .map(item => ({
                assigneeId: item.assignedTo,
                assigneeName: item.assignedTo ? userName(item.assignedTo) : 'Sin asignar',
                total: item._count
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        let slaNotStarted = 0;
        let slaOnTime = 0;
        let slaDueSoon = 0;
        let slaOverdue = 0;
        let resolvedCount = 0;
        let resolutionMinutesSum = 0;

        slaTickets.forEach(ticket => {
            if (ticket.status === 'FINALIZADO') {
                if (ticket.closedAt) {
                    resolvedCount += 1;
                    resolutionMinutesSum +=
                        (new Date(ticket.closedAt).getTime() - new Date(ticket.createdAt).getTime()) / 60000;
                }
                return;
            }

            if (!ticket.priorityId || !ticket.slaDueAt) {
                slaNotStarted += 1;
                return;
            }

            const dueAt = new Date(ticket.slaDueAt).getTime();
            const diffMinutes = (dueAt - now.getTime()) / 60000;

            if (diffMinutes < 0) {
                slaOverdue += 1;
            } else if (diffMinutes <= SLA_DUE_SOON_MINUTES) {
                slaDueSoon += 1;
            } else {
                slaOnTime += 1;
            }
        });

        const resolutionRate = totalTickets > 0
            ? Number(((closedTickets / totalTickets) * 100).toFixed(1))
            : 0;

        const avgResolutionMinutes = resolvedCount > 0
            ? Math.round(resolutionMinutesSum / resolvedCount)
            : null;

        const ticketsByDepartmentRaw = await prisma.ticket.findMany({
            where: dateFilter,
            include: {
                requester: {
                    select: {
                        department: true
                    }
                }
            }
        });

        const departmentMap = {};

        ticketsByDepartmentRaw.forEach(ticket => {
            const department = ticket.requester?.department || 'Sin departamento';
            departmentMap[department] = (departmentMap[department] || 0) + 1;
        });

        const ticketsByDepartment = Object.keys(departmentMap).map(department => ({
            department,
            total: departmentMap[department]
        }));

        return res.json({
            range,
            totalTickets,
            openTickets,
            pendingTickets,
            closedTickets,
            withoutPriorityTickets,
            createdToday,
            createdThisWeek,
            closedThisWeek,
            resolutionRate,
            avgResolutionMinutes,
            overdueTickets: slaOverdue,
            slaNotStarted,
            slaOnTime,
            slaDueSoon,
            slaOverdue,
            satisfactionAverage: satisfactionStats._avg.rating || 0,
            satisfactionTotal: satisfactionStats._count.rating || 0,
            ticketsByStatus,
            ticketsByPriority,
            ticketsByType,
            ticketsBySubtype,
            ticketsByCountry,
            ticketsByAssignee,
            ticketsByDepartment,
            latestTickets,
            latestSatisfactions,
            overdueTicketsList

        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al obtener dashboard'
        });
    }
};
const getMyAdminAlerts = async (req, res) => {
    try {
        const pendingAssignedTickets = await prisma.ticket.findMany({
            where: {
                tenantId: req.tenantId,
                assignedTo: req.user.id,
                status: 'PENDIENTE'
            },
            include: {
                requester: {
                    select: {
                        name: true,
                        department: true
                    }
                },
                type: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.json({
            totalPendingAssigned: pendingAssignedTickets.length,
            tickets: pendingAssignedTickets
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al obtener alertas del administrador'
        });
    }
};
module.exports = {
    getDashboardSummary,
    getMyAdminAlerts
};
