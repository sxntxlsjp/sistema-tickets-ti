const prisma = require('../config/prisma');
const ticketInclude = require('../utils/ticketInclude.util');
const { findTenantTicket } = require('../utils/ticketTenant.util');
const notificationService = require('../services/notification.service');
const runtimeLogger = require('../utils/runtimeLogger.util');

const generateTicketNumber = async () => {
    const lastTicket = await prisma.ticket.findFirst({
        orderBy: {
            id: 'desc'
        }
    });

    const nextNumber = lastTicket ? lastTicket.id + 1 : 1;

    return `TK-${String(nextNumber).padStart(6, '0')}`;
};

const createTicket = async (req, res) => {
    try {
const {
    typeId,
    subject,
    assignedTo,
    description,
    countryId,
    ticketSubtypeId
} = req.body;

        if (!typeId || !subject || !description || !assignedTo) {
            return res.status(400).json({
                message: 'Tipo de reporte, asunto, responsable asignado y descripción son obligatorios'
            });
        }

        const ticketType = await prisma.ticketType.findFirst({
            where: {
                id: Number(typeId),
                tenantId: req.tenantId
            }
        });

        if (!ticketType) {
            return res.status(400).json({
                message: 'El tipo de reporte seleccionado no pertenece a esta empresa'
            });
        }

        const assigneeMembership = await prisma.tenantUser.findFirst({
            where: {
                tenantId: req.tenantId,
                userId: Number(assignedTo),
                isActive: true,
                role: { in: ['TENANT_ADMIN', 'AGENT'] }
            }
        });

        if (!assigneeMembership) {
            return res.status(400).json({
                message: 'El responsable asignado debe pertenecer a esta empresa con un rol válido'
            });
        }

        const ticketNumber = await generateTicketNumber();


        let validCountryId = null;

        if (countryId) {
            validCountryId = Number(countryId);

            const country = await prisma.country.findFirst({
                where: {
                    id: validCountryId,
                    isActive: true
                }
            });

            if (!country) {
                return res.status(400).json({
                    success: false,
                    message: 'El país seleccionado no existe o no está activo'
                });
            }
        }
        let validTicketSubtypeId = null;

            if (ticketSubtypeId) {
                validTicketSubtypeId = Number(ticketSubtypeId);

                const subtype = await prisma.ticketSubtype.findFirst({
                    where: {
                        id: validTicketSubtypeId,
                        tenantId: req.tenantId,
                        ticketTypeId: Number(typeId),
                        isActive: true
                    }
                });

                if (!subtype) {
                    return res.status(400).json({
                        success: false,
                        message: 'El servicio afectado seleccionado no existe, no está activo o no pertenece al tipo de ticket seleccionado'
                    });
                }
            }
        const ticket = await prisma.ticket.create({
            data: {
                tenantId: req.tenantId,
                ticketNumber,
                requestedBy: req.user.id,
                typeId: Number(typeId),
                ticketSubtypeId: validTicketSubtypeId,
                subject,
                assignedTo: Number(assignedTo),
                description,
                status: 'PENDIENTE',

                countryId: validCountryId,

                // Nueva arquitectura de prioridad/SLA
                priorityId: null,
                slaStartedAt: null,
                slaDueAt: null,
                slaResolvedAt: null,
                slaStatus: 'ON_TIME'
            },
            include: ticketInclude
        });

        // Operación secundaria: el ticket ya está guardado y la respuesta exitosa no
        // debe esperar al SMTP. notifyTicketCreated nunca rechaza (atrapa sus propios
        // errores); el .catch() es una red de seguridad adicional.
        notificationService.notifyTicketCreated(ticket, req.tenant?.name).catch((error) => {
            runtimeLogger.logError('notification.ticket_created.unexpected_error', error, {
                ticketId: ticket.id
            });
        });

        return res.status(201).json({
            message: 'Ticket creado correctamente',
            ticket
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al crear el ticket'
        });
    }
};
const takeTicket = async (req, res) => {
    try {

        const ticketId = Number(req.params.id);

        const ticket = await findTenantTicket(ticketId, req.tenantId);

        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        if (ticket.status !== 'PENDIENTE') {
            return res.status(400).json({
                message: 'Solo se pueden tomar tickets pendientes'
            });
        }

        const updatedTicket = await prisma.ticket.update({
            where: {
                id: ticketId
            },
            data: {
                status: 'EN_REVISION'
            }
        });

        await prisma.ticketHistory.create({
            data: {
                ticketId,
                changedBy: req.user.id,
                oldStatus: 'PENDIENTE',
                newStatus: 'EN_REVISION',
                oldAssignedTo: ticket.assignedTo,
                newAssignedTo: ticket.assignedTo
            }
        });

        // Cambio real de estado (PENDIENTE -> EN_REVISION), ya confirmado en base de
        // datos. Operación secundaria, no bloqueante.
        notificationService.notifyTicketStatusChanged({
            ticketId,
            tenantId: req.tenantId,
            oldStatus: 'PENDIENTE',
            newStatus: 'EN_REVISION'
        }).catch((error) => {
            runtimeLogger.logError('notification.ticket_status_changed.unexpected_error', error, { ticketId });
        });

        return res.json({
            message: 'Ticket tomado correctamente',
            ticket: updatedTicket
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: 'Error al tomar ticket'
        });
    }
};

const assignTicketPriority = async (req, res) => {
    try {
        const ticketId = Number(req.params.id);
        const { priorityId } = req.body;

        if (!priorityId) {
            return res.status(400).json({
                success: false,
                message: 'La prioridad es obligatoria'
            });
        }

        const ticket = await findTenantTicket(ticketId, req.tenantId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket no encontrado'
            });
        }
        if (ticket.priorityId) {
            return res.status(400).json({
                success: false,
                message: 'Este ticket ya tiene una prioridad asignada'
            });
        }
        if (ticket.status === 'FINALIZADO') {
            return res.status(400).json({
                success: false,
                message: 'No se puede asignar prioridad a un ticket finalizado'
            });
        }

        const priority = await prisma.ticketPriority.findFirst({
            where: {
                id: Number(priorityId),
                tenantId: req.tenantId,
                isActive: true
            }
        });

        if (!priority) {
            return res.status(400).json({
                success: false,
                message: 'La prioridad seleccionada no existe o no está activa'
            });
        }

        const slaStartedAt = new Date();
        const slaDueAt = new Date(
            slaStartedAt.getTime() + priority.slaDurationMinutes * 60 * 1000
        );

        const updatedTicket = await prisma.ticket.update({
            where: {
                id: ticketId
            },
            data: {
                priorityId: priority.id,
                slaStartedAt,
                slaDueAt,
                slaStatus: 'ON_TIME'
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        jobTitle: true,
                        department: true,
                        profileImage: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        jobTitle: true,
                        department: true,
                        profileImage: true
                    }
                },
                type: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                ticketSubtype: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                priority: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        slaDurationMinutes: true,
                        color: true
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
            }
        });

        return res.json({
            success: true,
            message: 'Prioridad asignada correctamente y SLA iniciado',
            data: updatedTicket
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al asignar prioridad al ticket'
        });
    }
};

module.exports = {
    createTicket,
    takeTicket,
    assignTicketPriority
};