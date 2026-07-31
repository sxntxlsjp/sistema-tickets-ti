const prisma = require('../config/prisma');
const { findTenantTicket } = require('../utils/ticketTenant.util');
const { canAccessTicket } = require('../utils/ticketAccess.util');
const notificationService = require('../services/notification.service');
const runtimeLogger = require('../utils/runtimeLogger.util');

const SUPPORT_TENANT_ROLES = ['TENANT_ADMIN', 'AGENT'];

// Código oficial de Prisma (6.19.0, confirmado también en versiones anteriores) para
// "Transaction failed due to a write conflict or a deadlock. Please retry your
// transaction" — es el error que devuelve $transaction cuando el aislamiento
// Serializable detecta un conflicto real entre dos transacciones concurrentes.
const PRISMA_SERIALIZATION_CONFLICT_CODE = 'P2034';

const COMMENT_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    jobTitle: true,
    department: true,
    profileImage: true
};

// Fuente de autorización real (Sprint 19): isSuperAdmin global + tenantMembership.role
// del usuario autenticado en la petición. Nunca se confía en un rol enviado por el
// cliente ni en el body de la petición.
const getActingSupportRole = (req) => {
    if (req.user.isSuperAdmin) return 'SUPER_ADMIN';

    const tenantRole = req.tenantMembership?.role;

    return SUPPORT_TENANT_ROLES.includes(tenantRole) ? tenantRole : null;
};

const createCommentRow = (tx, ticketId, userId, comment) => {
    return tx.ticketComment.create({
        data: { ticketId, userId, comment },
        include: { user: { select: COMMENT_USER_SELECT } }
    });
};

const addComment = async (req, res) => {
    try {

        const { id } = req.params;
        const { comment } = req.body;

        if (!comment || comment.trim() === '') {
            return res.status(400).json({
                message: 'El comentario es obligatorio'
            });
        }

        const ticket = await findTenantTicket(Number(id), req.tenantId);

        if (!ticket || !canAccessTicket(req, ticket)) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        const ticketId = Number(id);
        const actingSupportRole = getActingSupportRole(req);

        let newComment;
        let isFirstSupportReply = false;

        if (!actingSupportRole) {
            // Comentarios de USER nunca activan la notificación de "primera
            // respuesta" ni requieren la verificación transaccional.
            newComment = await createCommentRow(prisma, ticketId, req.user.id, comment);

        } else {
            // Sprint 22 — detección de "primera respuesta de soporte" sin modificar
            // el schema (no hay tabla ni campo para esto). Se usa una transacción
            // con aislamiento Serializable: es la mejor protección posible sin una
            // restricción única persistida, pero no ofrece garantía absoluta ante
            // dos respuestas de soporte verdaderamente simultáneas en instancias
            // distintas — ver limitación documentada en el reporte del Sprint.
            try {
                const result = await prisma.$transaction(async (tx) => {
                    // Riesgo residual (documentado, no se corrige en este Sprint):
                    // TicketComment no almacena el rol del autor en el momento en que
                    // comentó — solo la relación con User/TenantUser actuales. Esta
                    // consulta evalúa el ROL ACTUAL de cada autor anterior, no el que
                    // tenía cuando comentó. Si un USER fue ascendido a AGENT/TENANT_ADMIN
                    // después de comentar, ese comentario antiguo pasaría a contar como
                    // "respuesta de soporte" retroactivamente (o el caso inverso, un
                    // agente degradado a USER dejaría de contar). Solucionarlo
                    // correctamente requeriría persistir el rol histórico en el propio
                    // comentario, lo cual implica modificar el schema — fuera de
                    // alcance de este Sprint.
                    const priorSupportComment = await tx.ticketComment.findFirst({
                        where: {
                            ticketId,
                            user: {
                                OR: [
                                    { isSuperAdmin: true },
                                    {
                                        tenantMemberships: {
                                            some: {
                                                tenantId: req.tenantId,
                                                role: { in: SUPPORT_TENANT_ROLES }
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        select: { id: true }
                    });

                    const created = await createCommentRow(tx, ticketId, req.user.id, comment);

                    return { priorSupportComment, created };
                }, { isolationLevel: 'Serializable' });

                newComment = result.created;
                isFirstSupportReply = !result.priorSupportComment;

            } catch (transactionError) {
                // Solo un conflicto de serialización real (P2034: dos respuestas de
                // soporte casi simultáneas bajo Serializable) justifica el fallback.
                // Cualquier otro error (caída de DB, violación de integridad, bug de
                // programación, resultado ambiguo de commit) debe propagarse: crear
                // el comentario de nuevo ahí podría duplicarlo u ocultar un error real.
                if (transactionError.code !== PRISMA_SERIALIZATION_CONFLICT_CODE) {
                    throw transactionError;
                }

                // El comentario NUNCA debe perderse por un conflicto de la
                // transacción. Se persiste de forma simple y, por seguridad, se
                // trata como "no es la primera" para minimizar el riesgo de un
                // correo duplicado en ese escenario raro.
                runtimeLogger.logError('notification.first_support_reply.transaction_degraded', transactionError, {
                    ticketId,
                    tenantId: req.tenantId,
                    prismaCode: transactionError.code
                });

                newComment = await createCommentRow(prisma, ticketId, req.user.id, comment);
                isFirstSupportReply = false;
            }
        }

        if (isFirstSupportReply) {
            notificationService.notifyFirstSupportReply({
                ticketId,
                tenantId: req.tenantId,
                responderName: newComment.user.name,
                responderRole: actingSupportRole,
                commentText: comment,
                commentedAt: newComment.createdAt
            }).catch((error) => {
                runtimeLogger.logError('notification.first_support_reply.unexpected_error', error, { ticketId });
            });
        } else if (actingSupportRole) {
            runtimeLogger.log('notification.first_support_reply.skipped', {
                ticketId,
                tenantId: req.tenantId,
                reason: 'not_first_support_comment'
            });
        }

        return res.status(201).json({
            message: 'Comentario agregado correctamente',
            comment: newComment
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al agregar comentario'
        });
    }
};

const getComments = async (req, res) => {
    try {

        const { id } = req.params;

        const ticket = await findTenantTicket(Number(id), req.tenantId);

        if (!ticket || !canAccessTicket(req, ticket)) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        const comments = await prisma.ticketComment.findMany({
            where: {
                ticketId: Number(id)
            },
            include: {
                user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            jobTitle: true,
                            department: true,
                            profileImage: true
                        }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return res.json(comments);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al obtener comentarios'
        });
    }
};

module.exports = {
    addComment,
    getComments
};
