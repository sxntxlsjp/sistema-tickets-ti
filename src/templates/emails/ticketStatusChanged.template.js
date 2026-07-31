const { buildEmailLayout, buildInfoTable } = require('./emailLayout.template');
const {
    escapeHtml,
    formatTicketStatus,
    formatDateTime,
    buildTicketUrl
} = require('../../utils/email.util');

const buildTicketStatusChangedEmail = ({
    ticketId,
    ticketNumber,
    subject,
    requesterName,
    oldStatus,
    newStatus,
    changedAt,
    changedByName
}) => {
    const ticketUrl = buildTicketUrl(ticketId);
    const safeRequesterName = escapeHtml(requesterName);
    const isFinalized = newStatus === 'FINALIZADO';

    const emailSubject = isFinalized
        ? `Tu ticket #${ticketNumber} ha sido finalizado`
        : `Actualización de tu ticket #${ticketNumber}`;

    const safeTitle = isFinalized
        ? `Tu ticket #${escapeHtml(ticketNumber)} ha sido finalizado`
        : `Actualización de tu ticket #${escapeHtml(ticketNumber)}`;

    const bodyHtml = `
        <p style="margin:0 0 4px; font-size:16px; font-weight:bold; color:#0F172A;">
            Hola ${safeRequesterName},
        </p>
        <p style="margin:0 0 16px; color:#475569;">
            El estado de tu ticket ha cambiado.
        </p>

        ${buildInfoTable([
            { label: 'Ticket', value: `#${escapeHtml(ticketNumber)}` },
            { label: 'Asunto', value: escapeHtml(subject) },
            { label: 'Estado anterior', value: formatTicketStatus(oldStatus) },
            { label: 'Estado nuevo', value: `<strong>${formatTicketStatus(newStatus)}</strong>` },
            { label: 'Fecha', value: formatDateTime(changedAt) },
            { label: 'Actualizado por', value: changedByName ? escapeHtml(changedByName) : null }
        ])}
    `;

    const html = buildEmailLayout({
        title: safeTitle,
        preheader: `${formatTicketStatus(oldStatus)} → ${formatTicketStatus(newStatus)}`,
        bodyHtml,
        ctaLabel: 'Ver ticket',
        ctaUrl: ticketUrl
    });

    const text = [
        `Hola ${requesterName},`,
        '',
        'El estado de tu ticket ha cambiado.',
        `Ticket: #${ticketNumber}`,
        `Asunto: ${subject}`,
        `Estado anterior: ${formatTicketStatus(oldStatus)}`,
        `Estado nuevo: ${formatTicketStatus(newStatus)}`,
        `Fecha: ${formatDateTime(changedAt)}`,
        changedByName ? `Actualizado por: ${changedByName}` : null,
        '',
        `Ver ticket: ${ticketUrl}`
    ].filter(Boolean).join('\n');

    return {
        subject: emailSubject,
        html,
        text
    };
};

module.exports = { buildTicketStatusChangedEmail };
