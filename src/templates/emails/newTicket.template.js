const { buildEmailLayout, buildInfoTable } = require('./emailLayout.template');
const {
    escapeHtml,
    escapeHtmlPreservingLineBreaks,
    formatTicketStatus,
    formatDateTime,
    buildTicketUrl
} = require('../../utils/email.util');

// Recibe datos ya resueltos, arma HTML y texto plano. No consulta Prisma ni lee
// variables de entorno (la URL ya viene construida por quien llama).
const buildNewTicketEmail = ({
    ticketId,
    ticketNumber,
    subject,
    description,
    status,
    createdAt,
    tenantName,
    requesterName,
    requesterEmail,
    countryName,
    typeName,
    subtypeName
}) => {
    const ticketUrl = buildTicketUrl(ticketId);
    const safeSubject = escapeHtml(subject);

    const bodyHtml = `
        <p style="margin:0 0 4px; font-size:16px; font-weight:bold; color:#0F172A;">
            Nuevo ticket creado
        </p>
        <p style="margin:0 0 16px; color:#475569;">
            Se registró una nueva solicitud de soporte en MasterDiv Desk.
        </p>

        ${buildInfoTable([
            { label: 'Ticket', value: `#${escapeHtml(ticketNumber)}` },
            { label: 'Empresa', value: escapeHtml(tenantName) },
            { label: 'Solicitante', value: escapeHtml(requesterName) },
            { label: 'Correo', value: escapeHtml(requesterEmail) },
            { label: 'País', value: countryName ? escapeHtml(countryName) : null },
            { label: 'Tipo', value: typeName ? escapeHtml(typeName) : null },
            { label: 'Servicio afectado', value: subtypeName ? escapeHtml(subtypeName) : null },
            { label: 'Estado inicial', value: formatTicketStatus(status) },
            { label: 'Fecha de creación', value: formatDateTime(createdAt) }
        ])}

        <p style="margin:16px 0 4px; font-weight:bold; color:#0F172A;">${safeSubject}</p>
        <p style="margin:0; color:#334155; white-space:pre-line;">
            ${escapeHtmlPreservingLineBreaks(description)}
        </p>
    `;

    const html = buildEmailLayout({
        title: `Nuevo ticket #${escapeHtml(ticketNumber)}`,
        preheader: `${safeSubject} — ${escapeHtml(requesterName)}`,
        bodyHtml,
        ctaLabel: 'Ver ticket',
        ctaUrl: ticketUrl
    });

    const text = [
        'Nuevo ticket creado en MasterDiv Desk',
        `Ticket: #${ticketNumber}`,
        `Empresa: ${tenantName}`,
        `Solicitante: ${requesterName} (${requesterEmail})`,
        countryName ? `País: ${countryName}` : null,
        typeName ? `Tipo: ${typeName}` : null,
        subtypeName ? `Servicio afectado: ${subtypeName}` : null,
        `Estado inicial: ${formatTicketStatus(status)}`,
        `Fecha de creación: ${formatDateTime(createdAt)}`,
        '',
        subject,
        description,
        '',
        `Ver ticket: ${ticketUrl}`
    ].filter(Boolean).join('\n');

    return {
        subject: `[Nuevo Ticket] #${ticketNumber} - ${subject}`,
        html,
        text
    };
};

module.exports = { buildNewTicketEmail };
