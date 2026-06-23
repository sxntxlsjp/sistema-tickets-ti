const prisma = require('../config/prisma');
const {
    calculateSla
} = require('../utils/sla.util');
const {
    notifyAdminNewTicket
} = require('../services/mail.service');

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
            priority,
            description,
            countryId
        } = req.body;

        if (!typeId || !subject || !description || !assignedTo) {
            return res.status(400).json({
                message: 'Tipo de reporte, asunto, responsable asignado y descripción son obligatorios'
            });
        }

        const ticketNumber = await generateTicketNumber();

        const sla = calculateSla(priority || 'MEDIA');
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
        const ticket = await prisma.ticket.create({
            data: {
                ticketNumber,
                requestedBy: req.user.id,
                typeId: Number(typeId),
                subject,
                assignedTo: Number(assignedTo),
                description,
                priority: priority || 'MEDIA',
                status: 'PENDIENTE',
                slaDueAt: sla.slaDueAt,
                slaStatus: sla.slaStatus,
                countryId: validCountryId
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
        await notifyAdminNewTicket(ticket);
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
module.exports = {
    createTicket,
    takeTicket
};