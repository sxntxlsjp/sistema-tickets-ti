const prisma = require('../config/prisma');
const { findTenantTicket } = require('../utils/ticketTenant.util');

const assignTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedTo } = req.body;

        if (!assignedTo) {
            return res.status(400).json({
                message: 'El nuevo responsable es obligatorio'
            });
        }

        const ticket = await findTenantTicket(Number(id), req.tenantId);

        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        const membership = await prisma.tenantUser.findFirst({
            where: {
                tenantId: req.tenantId,
                userId: Number(assignedTo),
                isActive: true,
                role: { in: ['TENANT_ADMIN', 'AGENT'] }
            }
        });

        if (!membership) {
            return res.status(400).json({
                message: 'El responsable asignado debe pertenecer a esta empresa con un rol válido'
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