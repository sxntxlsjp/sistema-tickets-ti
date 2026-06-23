const prisma = require('../config/prisma');

const addComment = async (req, res) => {
    try {

        const { id } = req.params;
        const { comment } = req.body;

        if (!comment || comment.trim() === '') {
            return res.status(400).json({
                message: 'El comentario es obligatorio'
            });
        }

        const ticket = await prisma.ticket.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        const newComment = await prisma.ticketComment.create({
            data: {
                ticketId: Number(id),
                userId: req.user.id,
                comment
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
            }
        });

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