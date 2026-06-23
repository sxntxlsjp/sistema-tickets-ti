const mailConfig = require('../config/mail');

const notifyAdminNewTicket = async (ticket) => {
    try {
        const ticketUrl = `${mailConfig.appUrl}/ticket-detail.html?id=${ticket.id}`;

        const emailContent = {
            to: mailConfig.adminEmail,
            subject: `Nuevo ticket creado: ${ticket.ticketNumber}`,
            html: `
                <h2>Nuevo ticket de soporte</h2>

                <p><strong>Número:</strong> ${ticket.ticketNumber}</p>
                <p><strong>Solicitante:</strong> ${ticket.requester?.name || 'No disponible'}</p>
                <p><strong>Correo:</strong> ${ticket.requester?.email || 'No disponible'}</p>
                <p><strong>Tipo:</strong> ${ticket.type?.name || 'No disponible'}</p>
                <p><strong>Asunto:</strong> ${ticket.subject}</p>
                <p><strong>Descripción:</strong> ${ticket.description}</p>
                <p><strong>Prioridad:</strong> ${ticket.priority}</p>

                <p>
                    <a href="${ticketUrl}">
                        Ver ticket
                    </a>
                </p>
            `
        };

        if (mailConfig.mode === 'development') {
            console.log('====================================');
            console.log('SIMULACIÓN DE CORREO');
            console.log('Para:', emailContent.to);
            console.log('Asunto:', emailContent.subject);
            console.log('Contenido:', emailContent.html);
            console.log('====================================');
            return;
        }

    } catch (error) {
        console.error('Error al notificar al administrador:', error);
    }
};

module.exports = {
    notifyAdminNewTicket
};