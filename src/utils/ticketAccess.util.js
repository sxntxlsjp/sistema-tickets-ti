const canAccessTicket = (req, ticket) => {
    if (!ticket || !req.tenantId || ticket.tenantId !== req.tenantId) {
        return false;
    }

    if (req.user.isSuperAdmin) {
        return true;
    }

    const role = req.tenantMembership?.role;

    if (role === 'TENANT_ADMIN') {
        return true;
    }

    if (role === 'AGENT') {
        return ticket.assignedTo === req.user.id;
    }

    return ticket.requestedBy === req.user.id;
};

module.exports = { canAccessTicket };
