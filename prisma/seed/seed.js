const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {

    // Empresa (Tenant) inicial para instalaciones nuevas
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'masterdiv-demo' },
        update: {},
        create: {
            name: 'MasterDiv Demo',
            slug: 'masterdiv-demo',
            legalName: 'MasterDiv Demo'
        }
    });

    // Crear usuario administrador (Super Administrador global de MasterDiv)
    const hashedPassword = await bcrypt.hash('Admin123*', 10);

    const admin = await prisma.user.upsert({
        where: {
            email: 'admin@sistema.com'
        },
        update: {},
        create: {
            name: 'Administrador',
            email: 'admin@sistema.com',
            passwordHash: hashedPassword,
            role: 'ADMIN',
            isSuperAdmin: true
        }
    });

    await prisma.tenantUser.upsert({
        where: {
            tenantId_userId: {
                tenantId: tenant.id,
                userId: admin.id
            }
        },
        update: {},
        create: {
            tenantId: tenant.id,
            userId: admin.id,
            role: 'TENANT_ADMIN'
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
                tenantId_name: {
                    tenantId: tenant.id,
                    name: type
                }
            },
            update: {},
            create: {
                tenantId: tenant.id,
                name: type
            }
        });
    }


}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });