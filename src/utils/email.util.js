const { escapeHtml } = require('./reportCharts');

// Estados reales del enum TicketStatus (prisma/schema.prisma). No inventar valores:
// estos son exactamente los que usa ticketStatus.controller.js (validStatuses).
const TICKET_STATUS_LABELS = {
    EN_REVISION: 'En revisión',
    PENDIENTE: 'Pendiente',
    FINALIZADO: 'Finalizado'
};

const formatTicketStatus = (status) => TICKET_STATUS_LABELS[status] || status;

// Etiquetas amigables para los roles reales de TenantRole + el caso SUPER_ADMIN
// (que no se almacena como TenantUser.role, ver Sprint 19).
const SUPPORT_ROLE_LABELS = {
    SUPER_ADMIN: 'Super Administrador',
    TENANT_ADMIN: 'Administrador',
    AGENT: 'Agente de soporte'
};

const formatSupportRoleLabel = (role) => SUPPORT_ROLE_LABELS[role] || 'Equipo de soporte';

const formatDateTime = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleString('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

// Construye la URL del ticket en un único lugar (nunca en cada plantilla). Usa la
// ruta real del frontend: public/ticket-detail.html?id=<id> (ver dashboard.js,
// tickets.js, users.js — todos navegan al detalle de esta misma forma).
const buildTicketUrl = (ticketId) => {
    const baseUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    return `${baseUrl}/ticket-detail.html?id=${ticketId}`;
};

// Preserva saltos de línea de texto libre (descripciones, comentarios) de forma
// segura: escapa primero, luego convierte \n en <br> — nunca al revés.
const escapeHtmlPreservingLineBreaks = (value) => {
    return escapeHtml(value || '').replace(/\r\n|\r|\n/g, '<br>');
};

module.exports = {
    escapeHtml,
    formatTicketStatus,
    formatSupportRoleLabel,
    formatDateTime,
    buildTicketUrl,
    escapeHtmlPreservingLineBreaks
};
