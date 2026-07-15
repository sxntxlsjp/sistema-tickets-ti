const prisma = require('../config/prisma');
const ticketInclude = require('../utils/ticketInclude.util');



const getMyTickets = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: {
                tenantId: req.tenantId,
                requestedBy: req.user.id
            },
            include: ticketInclude,
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
            where: {
                tenantId: req.tenantId
            },
            include: ticketInclude,
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