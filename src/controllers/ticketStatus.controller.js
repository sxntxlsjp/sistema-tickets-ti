const prisma = require('../config/prisma');

const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['EN_REVISION', 'PENDIENTE', 'FINALIZADO'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Estado no válido'
            });
        }

        const existingTicket = await prisma.ticket.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!existingTicket) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        const updatedTicket = await prisma.ticket.update({
            where: {
                id: Number(id)
            },
            data: {
                status,
                closedAt: status === 'FINALIZADO' ? new Date() : null
            }
        });

        await prisma.ticketHistory.create({
            data: {
                ticketId: existingTicket.id,
                changedBy: req.user.id,
                oldStatus: existingTicket.status,
                newStatus: status,
                oldAssignedTo: existingTicket.assignedTo,
                newAssignedTo: existingTicket.assignedTo
            }
        });

        return res.json({
            message: 'Estado del ticket actualizado correctamente',
            ticket: updatedTicket
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al actualizar el estado del ticket'
        });
    }
};

module.exports = {
    updateTicketStatus
};