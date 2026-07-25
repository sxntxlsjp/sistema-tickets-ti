const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const runtimeLogger = require('../utils/runtimeLogger.util');

// Pool pequeño y explícito (Sprint 21, Fase 3): plan Hostinger compartido, una sola
// instancia Node esperada, tráfico bajo. DATABASE_URL es la URL pooled de Neon —
// las migraciones usan DIRECT_URL por separado (ver prisma.config.ts / schema.prisma),
// nunca este pool. No crear un Pool por request: esta es la única instancia del proceso.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    min: 0,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: false
});

// Un cliente ocioso del pool puede emitir 'error' si Neon cierra el socket (normal en
// un plan serverless). Sin este listener, Node lo trata como uncaughtException y
// tumbaría el proceso. Se registra para diagnóstico; nunca se reconstruye el pool.
pool.on('error', (error) => {
    runtimeLogger.logError('database.pool.error', error);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

let isClosed = false;

// Cierre idempotente de ambos recursos (Sprint 21, Fase 3/10). Puede llamarse desde
// el flujo de shutdown; una segunda llamada no vuelve a cerrar lo ya cerrado.
const disconnect = async () => {
    if (isClosed) return;
    isClosed = true;

    await prisma.$disconnect();
    await pool.end();
};

module.exports = prisma;
module.exports.disconnect = disconnect;
