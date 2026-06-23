const prisma = require('../config/prisma');

// Obtener todos los países
const getCountries = async (req, res) => {
    try {
        const countries = await prisma.country.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        res.json({
            success: true,
            message: 'Países obtenidos correctamente',
            data: countries
        });
    } catch (error) {
        console.error('Error al obtener países:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener países'
        });
    }
};

// Obtener países activos
const getActiveCountries = async (req, res) => {
    try {
        const countries = await prisma.country.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json({
            success: true,
            message: 'Países activos obtenidos correctamente',
            data: countries
        });
    } catch (error) {
        console.error('Error al obtener países activos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener países activos'
        });
    }
};

// Crear país
const createCountry = async (req, res) => {
    try {
        const { name, code, flagEmoji } = req.body;

        if (!name || !code || !flagEmoji) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, código y bandera son obligatorios'
            });
        }

        const country = await prisma.country.create({
            data: {
                name,
                code,
                flagEmoji
            }
        });

        res.status(201).json({
            success: true,
            message: 'País creado correctamente',
            data: country
        });
    } catch (error) {
        console.error('Error al crear país:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear país'
        });
    }
};

// Actualizar país
const updateCountry = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, flagEmoji, isActive } = req.body;

        const country = await prisma.country.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                code,
                flagEmoji,
                isActive
            }
        });

        res.json({
            success: true,
            message: 'País actualizado correctamente',
            data: country
        });
    } catch (error) {
        console.error('Error al actualizar país:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar país'
        });
    }
};

// Eliminar país
const deleteCountry = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.country.delete({
            where: {
                id: Number(id)
            }
        });

        res.json({
            success: true,
            message: 'País eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar país:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar país'
        });
    }
};

module.exports = {
    getCountries,
    getActiveCountries,
    createCountry,
    updateCountry,
    deleteCountry
};