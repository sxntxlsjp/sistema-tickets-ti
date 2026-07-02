const prisma = require('../config/prisma');

// Listar todos los tipos de ticket
const getTicketTypes = async (req, res) => {
    try {
        const ticketTypes = await prisma.ticketType.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return res.json({
            success: true,
            message: 'Tipos de ticket obtenidos correctamente',
            data: ticketTypes
        });

    } catch (error) {
        console.error('Error al obtener tipos de ticket:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener tipos de ticket'
        });
    }
};

// Listar tipos activos para creación de tickets
const getActiveTicketTypes = async (req, res) => {
    try {
        const ticketTypes = await prisma.ticketType.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return res.json({
            success: true,
            message: 'Tipos de ticket activos obtenidos correctamente',
            data: ticketTypes
        });

    } catch (error) {
        console.error('Error al obtener tipos activos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener tipos de ticket activos'
        });
    }
};

// Crear tipo de ticket
const createTicketType = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El nombre debe tener entre 3 y 100 caracteres'
            });
        }

        const normalizedName = name.trim();

        const existingType = await prisma.ticketType.findUnique({
            where: {
                name: normalizedName
            }
        });

        if (existingType) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un tipo de ticket con ese nombre'
            });
        }

        const ticketType = await prisma.ticketType.create({
            data: {
                name: normalizedName,
                description: description ? description.trim() : null
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Tipo de ticket creado correctamente',
            data: ticketType
        });

    } catch (error) {
        console.error('Error al crear tipo de ticket:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear tipo de ticket'
        });
    }
};

// Editar tipo de ticket
const updateTicketType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        if (!name || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El nombre debe tener entre 3 y 100 caracteres'
            });
        }

        const ticketTypeId = Number(id);
        const normalizedName = name.trim();

        const ticketType = await prisma.ticketType.findUnique({
            where: {
                id: ticketTypeId
            }
        });

        if (!ticketType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de ticket no encontrado'
            });
        }

        const duplicateType = await prisma.ticketType.findFirst({
            where: {
                name: normalizedName,
                NOT: {
                    id: ticketTypeId
                }
            }
        });

        if (duplicateType) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe otro tipo de ticket con ese nombre'
            });
        }

        const updatedTicketType = await prisma.ticketType.update({
            where: {
                id: ticketTypeId
            },
            data: {
                name: normalizedName,
                description: description ? description.trim() : null,
                isActive: isActive !== undefined ? Boolean(isActive) : ticketType.isActive
            }
        });

        return res.json({
            success: true,
            message: 'Tipo de ticket actualizado correctamente',
            data: updatedTicketType
        });

    } catch (error) {
        console.error('Error al actualizar tipo de ticket:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar tipo de ticket'
        });
    }
};

// Activar o desactivar tipo de ticket
const toggleTicketTypeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El estado isActive es obligatorio'
            });
        }

        const ticketTypeId = Number(id);

        const ticketType = await prisma.ticketType.findUnique({
            where: {
                id: ticketTypeId
            }
        });

        if (!ticketType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de ticket no encontrado'
            });
        }

        const updatedTicketType = await prisma.ticketType.update({
            where: {
                id: ticketTypeId
            },
            data: {
                isActive: Boolean(isActive)
            }
        });

        return res.json({
            success: true,
            message: 'Estado del tipo de ticket actualizado correctamente',
            data: updatedTicketType
        });

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar estado del tipo de ticket'
        });
    }
};

// Eliminar tipo de ticket
const deleteTicketType = async (req, res) => {
    try {
        const { id } = req.params;
        const ticketTypeId = Number(id);

        const ticketType = await prisma.ticketType.findUnique({
            where: {
                id: ticketTypeId
            },
            include: {
                _count: {
                    select: {
                        tickets: true
                    }
                }
            }
        });

        if (!ticketType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de ticket no encontrado'
            });
        }

        if (ticketType._count.tickets > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar este tipo de ticket porque ya está siendo utilizado. Puede desactivarlo.'
            });
        }

        await prisma.ticketType.delete({
            where: {
                id: ticketTypeId
            }
        });

        return res.json({
            success: true,
            message: 'Tipo de ticket eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar tipo de ticket:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar tipo de ticket'
        });
    }
};

module.exports = {
    getTicketTypes,
    getActiveTicketTypes,
    createTicketType,
    updateTicketType,
    toggleTicketTypeStatus,
    deleteTicketType
};