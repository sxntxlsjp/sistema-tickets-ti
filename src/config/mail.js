// dotenv se carga una única vez en el entry point (src/server.js). Este módulo
// consume process.env directamente (Sprint 20, Bloque J).
const mailConfig = {
    mode: process.env.MAIL_MODE || 'development',
    adminEmail: process.env.ADMIN_EMAIL,
    appName: process.env.APP_NAME || 'Sistema de Tickets',
    appUrl: process.env.APP_URL || 'http://localhost:3000'
};

module.exports = mailConfig;