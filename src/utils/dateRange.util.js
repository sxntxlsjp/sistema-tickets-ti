const VALID_RANGES = ['today', 'week', '7d', '30d', 'month', 'all'];

const getDateRange = (range = 'all') => {

    const now = new Date();

    let startDate = null;

    switch (range) {

        case 'today':

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );

            break;

        case 'week':

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );
            startDate.setDate(
                startDate.getDate() - startDate.getDay()
            );

            break;

        case '7d':

            startDate = new Date(now);
            startDate.setDate(
                startDate.getDate() - 7
            );

            break;

        case '30d':

            startDate = new Date(now);
            startDate.setDate(
                startDate.getDate() - 30
            );

            break;

        case 'month':

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

            break;

        default:

            startDate = null;
    }

    return startDate;
};

module.exports = {
    getDateRange,
    VALID_RANGES
};
