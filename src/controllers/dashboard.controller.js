const prisma = require('../config/prisma');
const {
    getDateRange,
    VALID_RANGES
} = require('../utils/dateRange.util');

const SLA_DUE_SOON_MINUTES = 60;

// Caché en memoria local del proceso (Sprint 20, Bloque L) — no es una solución al
// panic de Prisma, solo contención para absorber clics dobles/cambios rápidos de rango.
// No usar Redis ni almacenamiento externo aquí. Aislada por tenant + rango; nunca se
// comparte entre tenants; nunca cachea respuestas de error; se invalida sola por TTL.
const DASHBOARD_CACHE_TTL_MS = 10_000;
const dashboardSummaryCache = new Map();

const getCachedSummary = (cacheKey) => {
    const entry = dashboardSummaryCache.get(cacheKey);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        dashboardSummaryCache.delete(cacheKey);
        return null;
    }

    return entry.payload;
};

const setCachedSummary = (cacheKey, payload) => {
    dashboardSummaryCache.set(cacheKey, {
        expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
        payload
    });
};

// Agrupa y cuenta en memoria replicando la forma de Prisma groupBy: [{ [byField]: value, _count: N }]
const groupCount = (items, byField, keyFn) => {
    const map = new Map();

    items.forEach(item => {
        const key = keyFn(item);
        map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).map(([key, count]) => ({
        [byField]: key,
        _count: count
    }));
};

const getDashboardSummary = async (req, res) => {
    try {
        const range =
            req.query.range || 'all';

        if (!VALID_RANGES.includes(range)) {
            return res.status(400).json({
                message: `Rango inválido. Valores permitidos: ${VALID_RANGES.join(', ')}`
            });
        }

        const cacheKey = `${req.tenantId}:${range}`;
        const cached = getCachedSummary(cacheKey);

        if (cached) {
            return res.json(cached);
        }

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

        // Consulta base única: trae solo los campos escalares necesarios para derivar
        // en memoria todos los conteos, agrupaciones, SLA y listas del rango seleccionado.
        // Sustituye ~15 operaciones (5 counts + 5 groupBy + slaTickets + ticketsByDepartment
        // + latestTickets + overdueTicketsList) de la versión anterior.
        const [
            ticketsInRange,
            priorities,
            types,
            subtypes,
            countries,
            users,
            createdToday,
            createdThisWeek,
            closedThisWeek,
            satisfactionStats,
            latestSatisfactions
        ] = await Promise.all([
            prisma.ticket.findMany({
                where: dateFilter,
                select: {
                    id: true,
                    ticketNumber: true,
                    subject: true,
                    status: true,
                    priorityId: true,
                    typeId: true,
                    ticketSubtypeId: true,
                    countryId: true,
                    assignedTo: true,
                    requestedBy: true,
                    slaStartedAt: true,
                    slaDueAt: true,
                    createdAt: true,
                    closedAt: true
                }
            }),
            prisma.ticketPriority.findMany({ where: { tenantId: req.tenantId }, select: { id: true, name: true, color: true } }),
            prisma.ticketType.findMany({ where: { tenantId: req.tenantId }, select: { id: true, name: true } }),
            prisma.ticketSubtype.findMany({ where: { tenantId: req.tenantId }, select: { id: true, name: true } }),
            prisma.country.findMany({ select: { id: true, name: true, flagEmoji: true } }),
            prisma.user.findMany({
                where: { tenantMemberships: { some: { tenantId: req.tenantId } } },
                select: { id: true, name: true, department: true }
            }),
            // Estas 3 son deliberadamente independientes del rango seleccionado (siempre
            // "hoy"/"esta semana" reales), por lo que no pueden derivarse de ticketsInRange.
            prisma.ticket.count({ where: { tenantId: req.tenantId, createdAt: { gte: startOfToday } } }),
            prisma.ticket.count({ where: { tenantId: req.tenantId, createdAt: { gte: startOfWeek } } }),
            prisma.ticket.count({ where: { tenantId: req.tenantId, status: 'FINALIZADO', closedAt: { gte: startOfWeek } } }),
            prisma.ticketSatisfaction.aggregate({
                where: satisfactionFilter,
                _avg: { rating: true },
                _count: { rating: true }
            }),
            // Puede referenciar tickets fuera de ticketsInRange (filtra por fecha de la
            // evaluación, no del ticket), así que se mantiene como consulta propia.
            prisma.ticketSatisfaction.findMany({
                where: satisfactionFilter,
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                    ticket: { select: { ticketNumber: true, subject: true } }
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
        const userDepartment = (id) => users.find(u => u.id === id)?.department || null;

        const totalTickets = ticketsInRange.length;
        const openTickets = ticketsInRange.filter(t => t.status === 'EN_REVISION').length;
        const pendingTickets = ticketsInRange.filter(t => t.status === 'PENDIENTE').length;
        const closedTickets = ticketsInRange.filter(t => t.status === 'FINALIZADO').length;
        const withoutPriorityTickets = ticketsInRange.filter(t => t.priorityId === null).length;

        const ticketsByStatus = groupCount(ticketsInRange, 'status', t => t.status);

        const ticketsByPriorityRaw = groupCount(ticketsInRange, 'priorityId', t => t.priorityId);
        const ticketsByTypeRaw = groupCount(ticketsInRange, 'typeId', t => t.typeId);
        const ticketsBySubtypeRaw = groupCount(ticketsInRange, 'ticketSubtypeId', t => t.ticketSubtypeId);
        const ticketsByCountryRaw = groupCount(ticketsInRange, 'countryId', t => t.countryId);

        const ticketsByAssigneeRaw = groupCount(
            ticketsInRange.filter(t => t.status !== 'FINALIZADO'),
            'assignedTo',
            t => t.assignedTo
        );

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

        ticketsInRange.forEach(ticket => {
            if (ticket.status === 'FINALIZADO') {
                if (ticket.closedAt) {
                    const resolutionMinutes =
                        (new Date(ticket.closedAt).getTime() - new Date(ticket.createdAt).getTime()) / 60000;

                    if (resolutionMinutes >= 0) {
                        resolvedCount += 1;
                        resolutionMinutesSum += resolutionMinutes;
                    }
                }
                return;
            }

            if (!ticket.priorityId || !ticket.slaStartedAt || !ticket.slaDueAt) {
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

        const departmentMap = {};

        ticketsInRange.forEach(ticket => {
            const department = userDepartment(ticket.requestedBy) || 'Sin departamento';
            departmentMap[department] = (departmentMap[department] || 0) + 1;
        });

        const ticketsByDepartment = Object.keys(departmentMap).map(department => ({
            department,
            total: departmentMap[department]
        }));

        const latestTickets = [...ticketsInRange]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(ticket => ({
                id: ticket.id,
                ticketNumber: ticket.ticketNumber,
                subject: ticket.subject,
                status: ticket.status,
                createdAt: ticket.createdAt,
                requester: { name: userName(ticket.requestedBy), department: userDepartment(ticket.requestedBy) },
                type: { name: typeName(ticket.typeId) },
                priority: { name: priorityName(ticket.priorityId), color: priorityColor(ticket.priorityId) },
                country: { name: countryName(ticket.countryId), flagEmoji: countryFlag(ticket.countryId) }
            }));

        const overdueTicketsList = ticketsInRange
            .filter(ticket =>
                ticket.status !== 'FINALIZADO' &&
                ticket.priorityId !== null &&
                ticket.slaDueAt &&
                new Date(ticket.slaDueAt) < now
            )
            .sort((a, b) => new Date(a.slaDueAt) - new Date(b.slaDueAt))
            .slice(0, 5)
            .map(ticket => ({
                id: ticket.id,
                ticketNumber: ticket.ticketNumber,
                subject: ticket.subject,
                slaDueAt: ticket.slaDueAt,
                assignee: { name: userName(ticket.assignedTo) },
                priority: { name: priorityName(ticket.priorityId), color: priorityColor(ticket.priorityId) }
            }));

        const summaryPayload = {
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
        };

        setCachedSummary(cacheKey, summaryPayload);

        return res.json(summaryPayload);

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
