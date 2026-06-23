const calculateSla = (priority) => {

    const now = new Date();

    let hours = 8;

    switch (priority) {

        case 'ALTA':
            hours = 4;
            break;

        case 'MEDIA':
            hours = 8;
            break;

        case 'BAJA':
            hours = 24;
            break;

        default:
            hours = 8;
    }

    const slaDueAt = new Date(
        now.getTime() + (hours * 60 * 60 * 1000)
    );

    return {
        slaDueAt,
        slaStatus: 'ON_TIME'
    };
};

const getSlaStatus = (ticket) => {

    if (!ticket.slaDueAt) {
        return 'ON_TIME';
    }

    const now = new Date();
    const dueDate = new Date(ticket.slaDueAt);

    const remainingHours =
        (dueDate - now) / (1000 * 60 * 60);

    if (ticket.status === 'FINALIZADO') {
        return 'RESOLVED';
    }

    if (remainingHours < 0) {
        return 'OVERDUE';
    }

    if (remainingHours <= 1) {
        return 'WARNING';
    }

    return 'ON_TIME';
};

module.exports = {
    calculateSla,
    getSlaStatus
};