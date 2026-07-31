const { buildEmailLayout, buildInfoTable } = require('./emailLayout.template');
const {
    escapeHtml,
    escapeHtmlPreservingLineBreaks,
    formatTicketStatus,
    formatSupportRoleLabel,
    formatDateTime,
    buildTicketUrl
} = require('../../utils/email.util');

const buildFirstSupportReplyEmail = ({
    ticketId,
    ticketNumber,
    subject,
    status,
    requesterName,
    responderName,
    responderRole,
    commentText,
    commentedAt
}) => {
    const ticketUrl = buildTicketUrl(ticketId);
    const safeRequesterName = escapeHtml(requesterName);

    const bodyHtml = `
        <p style="margin:0 0 4px; font-size:16px; font-weight:bold; color:#0F172A;">
            Hola ${safeRequesterName},
        </p>
        <p style="margin:0 0 16px; color:#475569;">
            Tu ticket ya está siendo atendido por nuestro equipo de soporte.
        </p>

        ${buildInfoTable([
            { label: 'Ticket', value: `#${escapeHtml(ticketNumber)}` },
            { label: 'Asunto', value: escapeHtml(subject) },
            { label: 'Respondido por', value: escapeHtml(responderName) },
            { label: 'Rol', value: escapeHtml(formatSupportRoleLabel(responderRole)) },
            { label: 'Fecha', value: formatDateTime(commentedAt) },
            { label: 'Estado actual', value: formatTicketStatus(status) }
        ])}

        <p style="margin:16px 0 4px; font-weight:bold; color:#0F172A;">Respuesta del equipo de soporte:</p>
        <p style="margin:0; color:#334155; white-space:pre-line;">
            ${escapeHtmlPreservingLineBreaks(commentText)}
        </p>
    `;

    const html = buildEmailLayout({
        title: `Tu ticket #${escapeHtml(ticketNumber)} ya está siendo atendido`,
        preheader: `${escapeHtml(responderName)} respondió tu ticket`,
        bodyHtml,
        ctaLabel: 'Ver ticket',
        ctaUrl: ticketUrl
    });

    const text = [
        `Hola ${requesterName},`,
        '',
        'Tu ticket ya está siendo atendido por nuestro equipo de soporte.',
        `Ticket: #${ticketNumber}`,
        `Asunto: ${subject}`,
        `Respondido por: ${responderName} (${formatSupportRoleLabel(responderRole)})`,
        `Fecha: ${formatDateTime(commentedAt)}`,
        `Estado actual: ${formatTicketStatus(status)}`,
        '',
        'Respuesta del equipo de soporte:',
        commentText,
        '',
        `Ver ticket: ${ticketUrl}`
    ].join('\n');

    return {
        subject: `Tu ticket #${ticketNumber} ya está siendo atendido`,
        html,
        text
    };
};

module.exports = { buildFirstSupportReplyEmail };
