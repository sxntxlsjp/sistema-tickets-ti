const prisma = require('../config/prisma');

const uploadAttachment = async (req, res) => {
    try {
        const { id } = req.params;

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

        if (!req.file) {
            return res.status(400).json({
                message: 'No se adjuntó ningún archivo'
            });
        }
        console.log('PROFILE FILE:', JSON.stringify(req.file, null, 2));
        console.log('ATTACHMENT FILE:', req.file);
        console.log('ATTACHMENT URL:', `/uploads/${req.file.filename}`);
        console.log('ATTACHMENT FILE:', JSON.stringify(req.file, null, 2));
        const attachment = await prisma.ticketAttachment.create({
            data: {
                ticketId: Number(id),
                uploadedBy: req.user.id,
                fileName: req.file.originalname,
                filePath: req.file.filename,
                mimeType: req.file.mimetype,
                fileSize: req.file.size
            }
        });

        return res.status(201).json({
            message: 'Archivo adjuntado correctamente',
            attachment
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al adjuntar archivo'
        });
    }
};

const getAttachments = async (req, res) => {
    try {
        const { id } = req.params;

        const attachments = await prisma.ticketAttachment.findMany({
            where: {
                ticketId: Number(id)
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        jobTitle: true,
                        department: true,
                        profileImage: true
                    }
                }
            },
            orderBy: {
                uploadedAt: 'desc'
            }
        });

        return res.json(attachments);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al obtener adjuntos'
        });
    }
};

module.exports = {
    uploadAttachment,
    getAttachments
};