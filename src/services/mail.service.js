const nodemailer = require('nodemailer');
const runtimeLogger = require('../utils/runtimeLogger.util');

// Responsabilidad exclusiva de este módulo (Sprint 22): transporter SMTP, validación
// de configuración, envío, remitente/Reply-To y sanitización de logs. Nunca decide
// QUÉ notificar ni A QUIÉN — eso es responsabilidad de notification.service.js.
// Nunca se le permite a un controller usar Nodemailer directamente.

// "Boolean(process.env.SMTP_SECURE)" sería un bug (Boolean("false") === true).
// Conversión explícita y segura de string a boolean.
const parseBooleanEnv = (value, defaultValue) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    return String(value).trim().toLowerCase() === 'true';
};

const REQUIRED_ENV_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];

const isSmtpConfigured = () => REQUIRED_ENV_VARS.every(name => Boolean(process.env[name]));

// Timeouts conservadores: evitan conexiones colgadas sin mantener el proceso ocupado
// por más tiempo del razonable. Un fallo por timeout se trata como fallo secundario.
const SMTP_TIMEOUTS_MS = {
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000
};

// Instancia única y reutilizable por proceso. nodemailer.createTransport() no abre
// ninguna conexión por sí solo (es perezoso hasta el primer envío) — por eso es
// seguro crearla aquí sin bloquear app.listen().
let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    if (!isSmtpConfigured()) return null;

runtimeLogger.log('smtp.configuration.debug', {
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    secure: parseBooleanEnv(process.env.SMTP_SECURE, true),
    user: process.env.SMTP_USER || null,
    passwordConfigured: Boolean(process.env.SMTP_PASSWORD),
    passwordLength: process.env.SMTP_PASSWORD
        ? process.env.SMTP_PASSWORD.length
        : 0,
    userLength: process.env.SMTP_USER
        ? process.env.SMTP_USER.length
        : 0,
    userHasWhitespace:
        Boolean(process.env.SMTP_USER) &&
        process.env.SMTP_USER !== process.env.SMTP_USER.trim(),
    passwordHasLeadingWhitespace:
        Boolean(process.env.SMTP_PASSWORD) &&
        process.env.SMTP_PASSWORD !== process.env.SMTP_PASSWORD.trimStart(),
    passwordHasTrailingWhitespace:
        Boolean(process.env.SMTP_PASSWORD) &&
        process.env.SMTP_PASSWORD !== process.env.SMTP_PASSWORD.trimEnd()
});

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: parseBooleanEnv(process.env.SMTP_SECURE, true),

        logger: true,
        debug: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        ...SMTP_TIMEOUTS_MS
    });

    return transporter;
};

// Solo el dominio del destinatario se registra por defecto (minimización de datos
// personales en logs) — nunca la dirección completa, nunca el cuerpo del correo.
const recipientDomain = (address) => {
    const match = /@([^,>\s]+)/.exec(String(address || ''));
    return match ? match[1] : 'unknown';
};

// Nodemailer adjunta mucho contexto a sus errores (a veces incluye el comando SMTP
// completo). Se conserva solo lo diagnosticable: código, respuesta corta y mensaje.
const sanitizeMailError = (error) => ({
    name: error?.name,
    code: error?.code,
    responseCode: error?.responseCode
});

// Envía un correo ya armado (subject/html/text). No arma plantillas ni decide
// destinatarios — eso ya vino resuelto de notification.service.js.
const sendMail = async ({ to, subject, html, text, notificationType }) => {
    const activeTransporter = getTransporter();

    if (!activeTransporter) {
        runtimeLogger.log('mail.send.skipped', {
            notificationType,
            reason: 'smtp_not_configured',
            recipientDomain: recipientDomain(to)
        });
        return { sent: false, reason: 'smtp_not_configured' };
    }

    const startedAt = Date.now();

    runtimeLogger.log('mail.send.start', {
        notificationType,
        recipientDomain: recipientDomain(to)
    });

    try {
        await activeTransporter.sendMail({
            from: process.env.MAIL_FROM || 'MasterDiv Desk <tickets@masterdiv.com>',
            replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM,
            to,
            subject,
            html,
            text
        });

        runtimeLogger.log('mail.send.success', {
            notificationType,
            recipientDomain: recipientDomain(to),
            durationMs: Date.now() - startedAt
        });

        return { sent: true };

    } catch (error) {
        runtimeLogger.log('mail.send.failure', {
            notificationType,
            recipientDomain: recipientDomain(to),
            durationMs: Date.now() - startedAt,
            error: sanitizeMailError(error)
        });

        return { sent: false, reason: 'smtp_error' };
    }
};

module.exports = {
    sendMail,
    isSmtpConfigured
};
