const nodemailer = require('nodemailer');

const parseBooleanEnv = (value, defaultValue) => {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    return String(value).trim().toLowerCase() === 'true';
};

const run = async () => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: parseBooleanEnv(process.env.SMTP_SECURE, true),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000
    });

    try {
        await transporter.verify();

        console.log('SMTP VERIFY OK');
        console.log({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: parseBooleanEnv(process.env.SMTP_SECURE, true),
            user: process.env.SMTP_USER
        });
    } catch (error) {
        console.error('SMTP VERIFY FAILED');
        console.error({
            name: error?.name,
            code: error?.code,
            responseCode: error?.responseCode,
            response: error?.response,
            command: error?.command,
            message: error?.message
        });

        process.exitCode = 1;
    } finally {
        transporter.close();
    }
};

run();