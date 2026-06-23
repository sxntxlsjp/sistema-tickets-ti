const prisma = require('../config/prisma');

const getMyTickets = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: {
                requestedBy: req.user.id
            },
            include: {
                type: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                country: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        flagEmoji: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.json(tickets);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al obtener mis tickets'
        });
    }
};

const getAllTickets = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                type: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                country: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        flagEmoji: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.json(tickets);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al obtener tickets'
        });
    }
};

module.exports = {
    getMyTickets,
    getAllTickets
};