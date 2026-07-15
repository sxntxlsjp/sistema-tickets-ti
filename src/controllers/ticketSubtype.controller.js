const prisma = require('../config/prisma');

// Listar todos los subtipos
const getTicketSubtypes = async (req, res) => {
    try {
        const subtypes = await prisma.ticketSubtype.findMany({
            where: {
                tenantId: req.tenantId
            },
            include: {
                ticketType: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                {
                    ticketTypeId: 'asc'
                },
                {
                    displayOrder: 'asc'
                },
                {
                    name: 'asc'
                }
            ]
        });

        return res.json({
            success: true,
            message: 'Subtipos de ticket obtenidos correctamente',
            data: subtypes
        });

    } catch (error) {
        console.error('Error al obtener subtipos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener subtipos de ticket'
        });
    }
};

// Listar subtipos por tipo de ticket
const getTicketSubtypesByType = async (req, res) => {
    try {
        const { ticketTypeId } = req.params;

        const subtypes = await prisma.ticketSubtype.findMany({
            where: {
                tenantId: req.tenantId,
                ticketTypeId: Number(ticketTypeId)
            },
            include: {
                ticketType: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                {
                    displayOrder: 'asc'
                },
                {
                    name: 'asc'
                }
            ]
        });

        return res.json({
            success: true,
            message: 'Subtipos por tipo de ticket obtenidos correctamente',
            data: subtypes
        });

    } catch (error) {
        console.error('Error al obtener subtipos por tipo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener subtipos por tipo de ticket'
        });
    }
};

// Listar subtipos activos por tipo de ticket
const getActiveTicketSubtypesByType = async (req, res) => {
    try {
        const { ticketTypeId } = req.params;

        const subtypes = await prisma.ticketSubtype.findMany({
            where: {
                tenantId: req.tenantId,
                ticketTypeId: Number(ticketTypeId),
                isActive: true,
                ticketType: {
                    isActive: true
                }
            },
            select: {
                id: true,
                ticketTypeId: true,
                name: true,
                description: true,
                displayOrder: true,
                isActive: true
            },
            orderBy: [
                {
                    displayOrder: 'asc'
                },
                {
                    name: 'asc'
                }
            ]
        });

        return res.json({
            success: true,
            message: 'Subtipos activos obtenidos correctamente',
            data: subtypes
        });

    } catch (error) {
        console.error('Error al obtener subtipos activos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener subtipos activos'
        });
    }
};

// Crear subtipo
const createTicketSubtype = async (req, res) => {
    try {
        const {
            ticketTypeId,
            name,
            description,
            displayOrder
        } = req.body;

        if (!ticketTypeId || !name || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El tipo de ticket y un nombre entre 3 y 100 caracteres son obligatorios'
            });
        }

        const normalizedName = name.trim();
        const parsedTicketTypeId = Number(ticketTypeId);

        const ticketType = await prisma.ticketType.findFirst({
            where: {
                id: parsedTicketTypeId,
                tenantId: req.tenantId
            }
        });

        if (!ticketType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de ticket no encontrado'
            });
        }

        const duplicateSubtype = await prisma.ticketSubtype.findFirst({
            where: {
                tenantId: req.tenantId,
                ticketTypeId: parsedTicketTypeId,
                name: normalizedName
            }
        });

        if (duplicateSubtype) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un subtipo con ese nombre para este tipo de ticket'
            });
        }

        const subtype = await prisma.ticketSubtype.create({
            data: {
                tenantId: req.tenantId,
                ticketTypeId: parsedTicketTypeId,
                name: normalizedName,
                description: description ? description.trim() : null,
                displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0
            },
            include: {
                ticketType: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Subtipo de ticket creado correctamente',
            data: subtype
        });

    } catch (error) {
        console.error('Error al crear subtipo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear subtipo de ticket'
        });
    }
};

// Editar subtipo
const updateTicketSubtype = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            ticketTypeId,
            name,
            description,
            displayOrder,
            isActive
        } = req.body;

        if (!name || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El nombre debe tener entre 3 y 100 caracteres'
            });
        }

        const subtypeId = Number(id);
        const normalizedName = name.trim();

        const subtype = await prisma.ticketSubtype.findFirst({
            where: {
                id: subtypeId,
                tenantId: req.tenantId
            }
        });

        if (!subtype) {
            return res.status(404).json({
                success: false,
                message: 'Subtipo de ticket no encontrado'
            });
        }

        const parsedTicketTypeId = ticketTypeId !== undefined
            ? Number(ticketTypeId)
            : subtype.ticketTypeId;

        const ticketType = await prisma.ticketType.findFirst({
            where: {
                id: parsedTicketTypeId,
                tenantId: req.tenantId
            }
        });

        if (!ticketType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de ticket no encontrado'
            });
        }

        const duplicateSubtype = await prisma.ticketSubtype.findFirst({
            where: {
                tenantId: req.tenantId,
                ticketTypeId: parsedTicketTypeId,
                name: normalizedName,
                NOT: {
                    id: subtypeId
                }
            }
        });

        if (duplicateSubtype) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe otro subtipo con ese nombre para este tipo de ticket'
            });
        }

        const updatedSubtype = await prisma.ticketSubtype.update({
            where: {
                id: subtypeId
            },
            data: {
                ticketTypeId: parsedTicketTypeId,
                name: normalizedName,
                description: description ? description.trim() : null,
                displayOrder: displayOrder !== undefined ? Number(displayOrder) : subtype.displayOrder,
                isActive: isActive !== undefined ? Boolean(isActive) : subtype.isActive
            },
            include: {
                ticketType: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return res.json({
            success: true,
            message: 'Subtipo de ticket actualizado correctamente',
            data: updatedSubtype
        });

    } catch (error) {
        console.error('Error al actualizar subtipo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar subtipo de ticket'
        });
    }
};

// Activar o desactivar subtipo
const toggleTicketSubtypeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El estado isActive es obligatorio'
            });
        }

        const subtypeId = Number(id);

        const subtype = await prisma.ticketSubtype.findFirst({
            where: {
                id: subtypeId,
                tenantId: req.tenantId
            }
        });

        if (!subtype) {
            return res.status(404).json({
                success: false,
                message: 'Subtipo de ticket no encontrado'
            });
        }

        const updatedSubtype = await prisma.ticketSubtype.update({
            where: {
                id: subtypeId
            },
            data: {
                isActive: Boolean(isActive)
            },
            include: {
                ticketType: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return res.json({
            success: true,
            message: 'Estado del subtipo actualizado correctamente',
            data: updatedSubtype
        });

    } catch (error) {
        console.error('Error al actualizar estado del subtipo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar estado del subtipo'
        });
    }
};

// Eliminar subtipo
const deleteTicketSubtype = async (req, res) => {
    try {
        const { id } = req.params;
        const subtypeId = Number(id);

        const subtype = await prisma.ticketSubtype.findFirst({
            where: {
                id: subtypeId,
                tenantId: req.tenantId
            },
            include: {
                _count: {
                    select: {
                        tickets: true
                    }
                }
            }
        });

        if (!subtype) {
            return res.status(404).json({
                success: false,
                message: 'Subtipo de ticket no encontrado'
            });
        }

        if (subtype._count.tickets > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar este subtipo porque ya está siendo utilizado. Puede desactivarlo.'
            });
        }

        await prisma.ticketSubtype.delete({
            where: {
                id: subtypeId
            }
        });

        return res.json({
            success: true,
            message: 'Subtipo de ticket eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar subtipo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar subtipo de ticket'
        });
    }
};

module.exports = {
    getTicketSubtypes,
    getTicketSubtypesByType,
    getActiveTicketSubtypesByType,
    createTicketSubtype,
    updateTicketSubtype,
    toggleTicketSubtypeStatus,
    deleteTicketSubtype
};