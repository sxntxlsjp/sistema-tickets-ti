const ticketInclude = {
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
};

module.exports = ticketInclude;