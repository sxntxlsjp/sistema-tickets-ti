const prisma = require('../config/prisma');

const findTenantTicket = (ticketId, tenantId, extra = {}) => {
    return prisma.ticket.findFirst({
        where: { id: ticketId, tenantId, ...extra }
    });
};

module.exports = { findTenantTicket };
