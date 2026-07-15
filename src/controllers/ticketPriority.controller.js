const prisma = require('../config/prisma');

// Listar todas las prioridades
const getTicketPriorities = async (req, res) => {
    try {

        const priorities = await prisma.ticketPriority.findMany({
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
            message: 'Prioridades obtenidas correctamente',
            data: priorities
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener prioridades'
        });
    }
};

// Listar prioridades activas
const getActiveTicketPriorities = async (req, res) => {
    try {

        const priorities = await prisma.ticketPriority.findMany({
            where: {
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
            message: 'Prioridades activas obtenidas correctamente',
            data: priorities
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener prioridades activas'
        });
    }
};

// Crear prioridad
const createTicketPriority = async (req, res) => {

    try {

        const {
            name,
            description,
            slaDurationMinutes,
            color,
            displayOrder
        } = req.body;

        if (!name || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El nombre debe tener entre 3 y 100 caracteres'
            });
        }

        if (!slaDurationMinutes || Number(slaDurationMinutes) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El SLA debe ser mayor a cero minutos'
            });
        }

        const exists = await prisma.ticketPriority.findUnique({
            where: {
                name: name.trim()
            }
        });

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una prioridad con ese nombre'
            });
        }

        const priority = await prisma.ticketPriority.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                slaDurationMinutes: Number(slaDurationMinutes),
                color: color || null,
                displayOrder: displayOrder ? Number(displayOrder) : 0
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Prioridad creada correctamente',
            data: priority
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Error al crear prioridad'
        });
    }
};

// Editar prioridad
const updateTicketPriority = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            slaDurationMinutes,
            color,
            displayOrder,
            isActive
        } = req.body;

        if (!name || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El nombre debe tener entre 3 y 100 caracteres'
            });
        }

        if (!slaDurationMinutes || Number(slaDurationMinutes) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El SLA debe ser mayor a cero minutos'
            });
        }

        const priorityId = Number(id);

        const priority = await prisma.ticketPriority.findUnique({
            where: {
                id: priorityId
            }
        });

        if (!priority) {
            return res.status(404).json({
                success: false,
                message: 'Prioridad no encontrada'
            });
        }

        const duplicate = await prisma.ticketPriority.findFirst({
            where: {
                name: name.trim(),
                NOT: {
                    id: priorityId
                }
            }
        });

        if (duplicate) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe otra prioridad con ese nombre'
            });
        }

        const updatedPriority = await prisma.ticketPriority.update({
            where: {
                id: priorityId
            },
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                slaDurationMinutes: Number(slaDurationMinutes),
                color: color || null,
                displayOrder: displayOrder !== undefined ? Number(displayOrder) : priority.displayOrder,
                isActive: isActive !== undefined ? Boolean(isActive) : priority.isActive
            }
        });

        return res.json({
            success: true,
            message: 'Prioridad actualizada correctamente',
            data: updatedPriority
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar prioridad'
        });
    }
};

// Activar o desactivar prioridad
const toggleTicketPriorityStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El estado isActive es obligatorio'
            });
        }

        const priorityId = Number(id);

        const priority = await prisma.ticketPriority.findUnique({
            where: {
                id: priorityId
            }
        });

        if (!priority) {
            return res.status(404).json({
                success: false,
                message: 'Prioridad no encontrada'
            });
        }

        const updatedPriority = await prisma.ticketPriority.update({
            where: {
                id: priorityId
            },
            data: {
                isActive: Boolean(isActive)
            }
        });

        return res.json({
            success: true,
            message: 'Estado de la prioridad actualizado correctamente',
            data: updatedPriority
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de la prioridad'
        });
    }
};

// Eliminar prioridad
const deleteTicketPriority = async (req, res) => {
    try {
        const { id } = req.params;
        const priorityId = Number(id);

        const priority = await prisma.ticketPriority.findUnique({
            where: {
                id: priorityId
            },
            include: {
                _count: {
                    select: {
                        tickets: true
                    }
                }
            }
        });

        if (!priority) {
            return res.status(404).json({
                success: false,
                message: 'Prioridad no encontrada'
            });
        }

        if (priority._count.tickets > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar esta prioridad porque ya está siendo utilizada. Puede desactivarla.'
            });
        }

        await prisma.ticketPriority.delete({
            where: {
                id: priorityId
            }
        });

        return res.json({
            success: true,
            message: 'Prioridad eliminada correctamente'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar prioridad'
        });
    }
};

module.exports = {
    getTicketPriorities,
    getActiveTicketPriorities,
    createTicketPriority,
    updateTicketPriority,
    toggleTicketPriorityStatus,
    deleteTicketPriority
};