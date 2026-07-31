const prisma = require('../config/prisma');
const { findTenantTicket } = require('../utils/ticketTenant.util');
const notificationService = require('../services/notification.service');
const runtimeLogger = require('../utils/runtimeLogger.util');

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

        const existingTicket = await findTenantTicket(Number(id), req.tenantId);

        if (!existingTicket) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }
        if (status === 'FINALIZADO' && !existingTicket.priorityId) {
            return res.status(400).json({
                success: false,
                message: 'Debe asignarse una prioridad antes de finalizar el ticket'
            });
        }
        const resolvedAt = status === 'FINALIZADO' ? new Date() : null;

        const updatedTicket = await prisma.ticket.update({
            where: {
                id: Number(id)
            },
            data: {
                status,
                closedAt: resolvedAt,
                slaResolvedAt: resolvedAt
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

        // Solo notificar si el estado realmente cambió (comparación de valores del
        // backend, nunca del texto visible del frontend) y ya confirmado en base de
        // datos. Operación secundaria, no bloqueante.
        if (existingTicket.status !== status) {
            notificationService.notifyTicketStatusChanged({
                ticketId: existingTicket.id,
                tenantId: req.tenantId,
                oldStatus: existingTicket.status,
                newStatus: status
            }).catch((error) => {
                runtimeLogger.logError('notification.ticket_status_changed.unexpected_error', error, {
                    ticketId: existingTicket.id
                });
            });
        }

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