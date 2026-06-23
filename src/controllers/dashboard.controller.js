const prisma = require('../config/prisma');
const {
    getDateRange
} = require('../utils/dateRange.util');

const getDashboardSummary = async (req, res) => {
    try {
        const range =
            req.query.range || 'all';

        const startDate =
            getDateRange(range);

        const dateFilter =
            startDate
                ? {
                    createdAt: {
                        gte: startDate
                    }
                }
                : {};
        const totalTickets = await prisma.ticket.count({
                where: dateFilter
        });

        const openTickets = await prisma.ticket.count({
            where: {
                    ...dateFilter,
                    status: 'EN_REVISION'
                    }
        });

        const pendingTickets = await prisma.ticket.count({
            where: { ...dateFilter, status: 'PENDIENTE' }
        });

        const closedTickets = await prisma.ticket.count({
            where: { ...dateFilter, status: 'FINALIZADO' }
        });

        const overdueTickets = await prisma.ticket.count({
            where: { ...dateFilter,
                status: {
                    not: 'FINALIZADO'
                },
                slaDueAt: {
                    lt: new Date()
                }
            }
        });

        const ticketsByStatus = await prisma.ticket.groupBy({
            by: ['status'],
            where: dateFilter,
            _count: true
        });

        const ticketsByPriority = await prisma.ticket.groupBy({
            by: ['priority'],
            where: dateFilter,
            _count: true
        });

        const ticketsByTypeRaw = await prisma.ticket.groupBy({
            by: ['typeId'],
            where: dateFilter,
            _count: true
        });

        const typeNames = await prisma.ticketType.findMany({
            select: {
                id: true,
                name: true
            }
        });

        const ticketsByType = ticketsByTypeRaw.map(item => ({
            typeId: item.typeId,
            typeName: typeNames.find(t => t.id === item.typeId)?.name || 'Sin tipo',
            total: item._count
        }));

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

        const satisfactionDateFilter =
            startDate
                ? {
                    createdAt: {
                        gte: startDate
                    }
                }
                : {};

        const satisfactionStats = await prisma.ticketSatisfaction.aggregate({
            where: satisfactionDateFilter,
            _avg: {
                rating: true
            },
            _count: {
                rating: true
            }
        });

        const latestTickets = await prisma.ticket.findMany({
            where: dateFilter,
            take: 5,
            orderBy: {
                createdAt: 'desc'
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
            }
        });

        const latestSatisfactions = await prisma.ticketSatisfaction.findMany({
            where: satisfactionDateFilter,
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
                ticket: {
                    select: {
                        ticketNumber: true,
                        subject: true
                    }
                }
            }
        });

        return res.json({
            range,
            totalTickets,
            openTickets,
            pendingTickets,
            closedTickets,
            overdueTickets,
            satisfactionAverage: satisfactionStats._avg.rating || 0,
            satisfactionTotal: satisfactionStats._count.rating || 0,
            ticketsByStatus,
            ticketsByPriority,
            ticketsByType,
            ticketsByDepartment,
            latestTickets,
            latestSatisfactions
            
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