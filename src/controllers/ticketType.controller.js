const prisma = require('../config/prisma');

const getTicketTypes = async (req, res) => {
    try {
        const ticketTypes = await prisma.ticketType.findMany({
            where: {
                isActive: true
            },
            select: {
                id: true,
                name: true,
                description: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return res.json(ticketTypes);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al obtener tipos de ticket'
        });
    }
};

module.exports = {
    getTicketTypes
};