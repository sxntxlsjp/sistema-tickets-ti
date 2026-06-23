const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {

    console.log('Iniciando carga de datos...');

    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('Admin123*', 10);

    await prisma.user.upsert({
        where: {
            email: 'admin@sistema.com'
        },
        update: {},
        create: {
            name: 'Administrador',
            email: 'admin@sistema.com',
            passwordHash: hashedPassword,
            role: 'ADMIN'
        }
    });

    // Tipos de ticket
    const ticketTypes = [
        'Hardware',
        'Software',
        'Redes',
        'Correo Electrónico',
        'Accesos',
        'Impresoras',
        'Otros'
    ];

    for (const type of ticketTypes) {
        await prisma.ticketType.upsert({
            where: {
                name: type
            },
            update: {},
            create: {
                name: type
            }
        });
    }

    console.log('Datos iniciales cargados correctamente.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });