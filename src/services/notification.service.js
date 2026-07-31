const prisma = require('../config/prisma');
const runtimeLogger = require('../utils/runtimeLogger.util');
const mailService = require('./mail.service');
const { buildNewTicketEmail } = require('../templates/emails/newTicket.template');
const { buildFirstSupportReplyEmail } = require('../templates/emails/firstSupportReply.template');
const { buildTicketStatusChangedEmail } = require('../templates/emails/ticketStatusChanged.template');

// Responsabilidad de este módulo (Sprint 22): decidir destinatario y plantilla,
// llamar a mailService, y capturar/registrar cualquier fallo sin romper la operación
// principal. Nunca usa Nodemailer directamente ni conoce detalles SMTP.
//
// Todas las funciones públicas son "fire-and-forget seguras": nunca lanzan (siempre
// atrapan internamente), para que un controller pueda llamarlas con
// `notificationService.notifyX(...).catch(...)` — o incluso sin .catch(), ya que
// internamente nunca rechazan la promesa.

// Notificación 1 — Nuevo ticket. Recibe el ticket ya creado con sus relaciones
// (mismo objeto que devuelve createTicket vía ticketInclude) para no repetir la
// consulta. tenantName viene de req.tenant, ya disponible en el controller.
const notifyTicketCreated = async (ticket, tenantName) => {
    try {
        const to = process.env.TICKET_NOTIFICATION_EMAIL;

        if (!to) {
            runtimeLogger.log('notification.ticket_created.skipped', {
                ticketId: ticket.id,
                tenantId: ticket.tenantId,
                reason: 'notification_email_not_configured'
            });
            return;
        }

        const { subject, html, text } = buildNewTicketEmail({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            description: ticket.description,
            status: ticket.status,
            createdAt: ticket.createdAt,
            tenantName,
            requesterName: ticket.requester?.name || 'Desconocido',
            requesterEmail: ticket.requester?.email || 'Desconocido',
            countryName: ticket.country?.name || null,
            typeName: ticket.type?.name || null,
            subtypeName: ticket.ticketSubtype?.name || null
        });

        runtimeLogger.log('notification.ticket_created.queued', {
            ticketId: ticket.id,
            tenantId: ticket.tenantId
        });

        const result = await mailService.sendMail({
            to,
            subject,
            html,
            text,
            notificationType: 'ticket_created'
        });

        runtimeLogger.log(
            result.sent ? 'notification.ticket_created.sent' : 'notification.ticket_created.skipped',
            { ticketId: ticket.id, tenantId: ticket.tenantId, reason: result.reason }
        );

    } catch (error) {
        runtimeLogger.logError('notification.ticket_created.failure', error, {
            ticketId: ticket?.id,
            tenantId: ticket?.tenantId
        });
    }
};

// Notificación 2 — Primera respuesta de soporte. La detección de "es la primera"
// ocurre en el controller (junto a la transacción de creación del comentario, ver
// ticketComment.controller.js) — esta función solo arma y envía el correo al
// solicitante una vez que ya se decidió notificar.
const notifyFirstSupportReply = async ({ ticketId, tenantId, responderName, responderRole, commentText, commentedAt }) => {
    try {
        const ticket = await prisma.ticket.findFirst({
            where: { id: ticketId, tenantId },
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                status: true,
                requester: { select: { name: true, email: true } }
            }
        });

        if (!ticket) {
            runtimeLogger.log('notification.first_support_reply.skipped', {
                ticketId, tenantId, reason: 'ticket_not_found'
            });
            return;
        }

        if (!ticket.requester?.email) {
            runtimeLogger.log('notification.first_support_reply.skipped', {
                ticketId, tenantId, reason: 'requester_without_email'
            });
            return;
        }

        const { subject, html, text } = buildFirstSupportReplyEmail({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            status: ticket.status,
            requesterName: ticket.requester.name,
            responderName,
            responderRole,
            commentText,
            commentedAt
        });

        const result = await mailService.sendMail({
            to: ticket.requester.email,
            subject,
            html,
            text,
            notificationType: 'first_support_reply'
        });

        runtimeLogger.log(
            result.sent ? 'notification.first_support_reply.sent' : 'notification.first_support_reply.skipped',
            { ticketId, tenantId, reason: result.reason }
        );

    } catch (error) {
        runtimeLogger.logError('notification.first_support_reply.failure', error, { ticketId, tenantId });
    }
};

// Notificación 3 — Cambio de estado. El llamador ya debe haber verificado
// oldStatus !== newStatus y que la actualización en base de datos fue exitosa.
const notifyTicketStatusChanged = async ({ ticketId, tenantId, oldStatus, newStatus, changedByName }) => {
    try {
        if (oldStatus === newStatus) return;

        const ticket = await prisma.ticket.findFirst({
            where: { id: ticketId, tenantId },
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                requester: { select: { name: true, email: true } }
            }
        });

        if (!ticket) {
            runtimeLogger.log('notification.ticket_status_changed.skipped', {
                ticketId, tenantId, reason: 'ticket_not_found'
            });
            return;
        }

        if (!ticket.requester?.email) {
            runtimeLogger.log('notification.ticket_status_changed.skipped', {
                ticketId, tenantId, reason: 'requester_without_email'
            });
            return;
        }

        const { subject, html, text } = buildTicketStatusChangedEmail({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            requesterName: ticket.requester.name,
            oldStatus,
            newStatus,
            changedAt: new Date(),
            changedByName
        });

        const result = await mailService.sendMail({
            to: ticket.requester.email,
            subject,
            html,
            text,
            notificationType: 'ticket_status_changed'
        });

        runtimeLogger.log(
            result.sent ? 'notification.ticket_status_changed.sent' : 'notification.ticket_status_changed.skipped',
            { ticketId, tenantId, reason: result.reason }
        );

    } catch (error) {
        runtimeLogger.logError('notification.ticket_status_changed.failure', error, { ticketId, tenantId });
    }
};

module.exports = {
    notifyTicketCreated,
    notifyFirstSupportReply,
    notifyTicketStatusChanged
};
