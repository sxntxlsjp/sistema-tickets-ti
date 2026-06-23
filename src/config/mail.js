require('dotenv').config();

const mailConfig = {
    mode: process.env.MAIL_MODE || 'development',
    adminEmail: process.env.ADMIN_EMAIL,
    appName: process.env.APP_NAME || 'Sistema de Tickets',
    appUrl: process.env.APP_URL || 'http://localhost:3000'
};

module.exports = mailConfig;