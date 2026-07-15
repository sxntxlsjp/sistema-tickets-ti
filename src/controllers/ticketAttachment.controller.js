const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { findTenantTicket } = require('../utils/ticketTenant.util');
const { canAccessTicket } = require('../utils/ticketAccess.util');

const ticketUploadsPath = path.join(__dirname, '../uploads');

const uploadAttachment = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await findTenantTicket(Number(id), req.tenantId);

        if (!ticket || !canAccessTicket(req, ticket)) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'No se adjuntó ningún archivo'
            });
        }

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

        const ticket = await findTenantTicket(Number(id), req.tenantId);

        if (!ticket || !canAccessTicket(req, ticket)) {
            return res.status(404).json({
                message: 'Ticket no encontrado'
            });
        }

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

const downloadAttachment = async (req, res) => {
    try {
        const attachmentId = Number(req.params.id);

        const attachment = await prisma.ticketAttachment.findUnique({
            where: { id: attachmentId },
            include: { ticket: true }
        });

        if (!attachment || !attachment.ticket || !canAccessTicket(req, attachment.ticket)) {
            return res.status(404).json({
                message: 'Archivo no encontrado'
            });
        }

        const absolutePath = path.join(ticketUploadsPath, path.basename(attachment.filePath));

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                message: 'Archivo no encontrado'
            });
        }

        return res.download(absolutePath, attachment.fileName);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Error al descargar el archivo'
        });
    }
};

module.exports = {
    uploadAttachment,
    getAttachments,
    downloadAttachment
};