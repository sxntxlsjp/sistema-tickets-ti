const prisma = require('../config/prisma');
const ticketInclude = require('../utils/ticketInclude.util');
const { canAccessTicket } = require('../utils/ticketAccess.util');

const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.ticket.findFirst({
            where: {
                id: Number(id),
                tenantId: req.tenantId
            },
            include: {
                ...ticketInclude,
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                jobTitle: true,
                                department: true,
                                profileImage: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                attachments: {
                    include: {
                        uploader: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                                jobTitle: true,
                                department: true,
                                profileImage: true
                            }
                        }
                    },
                    orderBy: {
                        uploadedAt: 'desc'
                    }
                },
                satisfaction: true,
                histories: {
                    include: {
                        changer: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                jobTitle: true,
                                department: true,
                                profileImage: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!ticket || !canAccessTicket(req, ticket)) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }
const assigneeIds = ticket.histories
    .flatMap(history => [
        history.oldAssignedTo,
        history.newAssignedTo
    ])
    .filter(Boolean);

const uniqueAssigneeIds = [...new Set(assigneeIds)];

const assignees = await prisma.user.findMany({
    where: {
        id: {
            in: uniqueAssigneeIds
        }
    },
    select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        department: true,
        profileImage: true
    }
});

const assigneeMap = {};

assignees.forEach(user => {
    assigneeMap[user.id] = user;
});

ticket.histories = ticket.histories.map(history => ({
    ...history,
    oldAssignee: history.oldAssignedTo
        ? assigneeMap[history.oldAssignedTo] || null
        : null,
    newAssignee: history.newAssignedTo
        ? assigneeMap[history.newAssignedTo] || null
        : null
}));
        return res.json(ticket);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al obtener detalle del ticket'
        });
    }
};

module.exports = {
    getTicketById
};