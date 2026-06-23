const prisma = require('../config/prisma');

const assignTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedTo } = req.body;

        if (!assignedTo) {
            return res.status(400).json({
                message: 'El nuevo responsable es obligatorio'
            });
        }

        const ticket = await prisma.ticket.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        const newAssignee = await prisma.user.findUnique({
            where: {
                id: Number(assignedTo)
            }
        });

        if (!newAssignee || newAssignee.role !== 'ADMIN') {
            return res.status(400).json({
                message: 'El responsable asignado debe ser un administrador válido'
            });
        }

        const updatedTicket = await prisma.ticket.update({
            where: {
                id: Number(id)
            },
            data: {
                assignedTo: Number(assignedTo)
            },
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
                }
            }
        });

        await prisma.ticketHistory.create({
            data: {
                ticketId: ticket.id,
                changedBy: req.user.id,
                oldStatus: ticket.status,
                newStatus: ticket.status,
                oldAssignedTo: ticket.assignedTo,
                newAssignedTo: Number(assignedTo)
            }
        });

        return res.json({
            message: 'Ticket reasignado correctamente',
            ticket: updatedTicket
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al reasignar ticket'
        });
    }
};

module.exports = {
    assignTicket
};