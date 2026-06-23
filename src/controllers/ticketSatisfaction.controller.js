const prisma = require('../config/prisma');

const createSatisfaction = async (req, res) => {
    try {

        const ticketId = Number(req.params.ticketId);

        const {
            rating,
            comment
        } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'La calificación debe estar entre 1 y 5'
            });
        }

        const ticket = await prisma.ticket.findUnique({
            where: {
                id: ticketId
            }
        });

        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        if (ticket.status !== 'FINALIZADO') {
            return res.status(400).json({
                message: 'Solo se pueden calificar tickets finalizados'
            });
        }

        const existing = await prisma.ticketSatisfaction.findUnique({
            where: {
                ticketId
            }
        });

        if (existing) {
            return res.status(400).json({
                message: 'Este ticket ya fue calificado'
            });
        }

        const satisfaction =
            await prisma.ticketSatisfaction.create({
                data: {
                    ticketId,
                    userId: req.user.id,
                    rating,
                    comment
                }
            });

        return res.status(201).json({
            message: 'Gracias por tu evaluación',
            satisfaction
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: 'Error al guardar la evaluación'
        });
    }
};

module.exports = {
    createSatisfaction
};