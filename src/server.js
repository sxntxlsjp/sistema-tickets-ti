require('dotenv').config({ quiet: true });

const runtimeLogger = require('./utils/runtimeLogger.util');
const prisma = require('./config/prisma');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

let server;
let isShuttingDown = false;

const testPrismaConnection = async () => {
    const startedAt = Date.now();

    runtimeLogger.log('prisma.connect.start');

    try {
        await prisma.$queryRaw`SELECT 1`;

        runtimeLogger.log('prisma.connect.success', {
            durationMs: Date.now() - startedAt
        });

        return true;

    } catch (error) {
        runtimeLogger.log('prisma.connect.failure', {
            durationMs: Date.now() - startedAt
        });

        runtimeLogger.logError('prisma.connect.failure.detail', error, {
            clientVersion: error?.clientVersion,
            isPrismaRustPanic: error?.name === 'PrismaClientRustPanicError'
        });

        return false;
    }
};

// Cierre ordenado (Sprint 20, Bloque G). isShuttingDown evita ejecutar el flujo dos
// veces si SIGTERM/SIGINT/uncaughtException llegan casi al mismo tiempo. El timeout
// de seguridad garantiza que el proceso termine aunque el cierre limpio se cuelgue.
const shutdown = async (reason, exitCode = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    runtimeLogger.log('shutdown.start', { reason });

    const forceExitTimer = setTimeout(() => {
        runtimeLogger.log('shutdown.timeout_forced', { reason });
        process.exit(exitCode || 1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    if (server) {
        try {
            await new Promise((resolve, reject) => {
                server.close(error => (error ? reject(error) : resolve()));
            });
        } catch (error) {
            runtimeLogger.logError('shutdown.http_close_failed', error);
        }
    }

    try {
        await prisma.$disconnect();
    } catch (error) {
        runtimeLogger.logError('shutdown.prisma_disconnect_failed', error);
    }

    clearTimeout(forceExitTimer);
    runtimeLogger.log('shutdown.complete', { reason });
    process.exit(exitCode);
};

// Arranque controlado (Sprint 20, Bloque F): Express nunca escucha en el puerto si
// Prisma no respondió primero. Sin reintentos, sin bucles internos — si falla, el
// proceso termina con código distinto de cero y el supervisor del proveedor decide
// si reinicia (con un bootId nuevo, evidencia de que fue un reinicio real).
const start = async () => {
    runtimeLogger.logRuntimeStart();

    const prismaReady = await testPrismaConnection();

    if (!prismaReady) {
        runtimeLogger.log('runtime.startup_failed', { reason: 'prisma_unreachable' });

        try {
            await prisma.$disconnect();
        } catch (error) {
            runtimeLogger.logError('runtime.startup_disconnect_failed', error);
        }

        process.exitCode = 1;
        return;
    }

    server = app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        runtimeLogger.log('runtime.listening', { port: Number(PORT) });
    });

    server.on('error', (error) => {
        runtimeLogger.logError('runtime.listen_failed', error);
        shutdown('listen_error', 1);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

// Errores globales (Sprint 20, Bloque H). No se intenta seguir funcionando tras un
// uncaughtException: se registra y se ejecuta el cierre controlado. No se reconstruye
// PrismaClient en ningún punto de este archivo — siempre la misma instancia importada.
process.on('uncaughtException', (error) => {
    runtimeLogger.logError('runtime.uncaught_exception', error, {
        clientVersion: error?.clientVersion,
        isPrismaRustPanic: error?.name === 'PrismaClientRustPanicError'
    });

    shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    runtimeLogger.logError('runtime.unhandled_rejection', error, {
        clientVersion: error?.clientVersion,
        isPrismaRustPanic: error?.name === 'PrismaClientRustPanicError'
    });

    shutdown('unhandledRejection', 1);
});

process.on('beforeExit', (code) => {
    runtimeLogger.log('runtime.before_exit', { code });
});

process.on('exit', (code) => {
    runtimeLogger.log('runtime.exit', { code });
});

start();
