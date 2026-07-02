const prisma = require('../config/prisma');

// Obtener todas las configuraciones
const getSystemSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            orderBy: {
                key: 'asc'
            }
        });

        return res.json({
            success: true,
            message: 'Configuraciones obtenidas correctamente',
            data: settings
        });

    } catch (error) {
        console.error('Error al obtener configuraciones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener configuraciones'
        });
    }
};

// Obtener configuración por key
const getSystemSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;

        const setting = await prisma.systemSetting.findUnique({
            where: {
                key
            }
        });

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Configuración no encontrada'
            });
        }

        return res.json({
            success: true,
            message: 'Configuración obtenida correctamente',
            data: setting
        });

    } catch (error) {
        console.error('Error al obtener configuración:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener configuración'
        });
    }
};

// Crear configuración
const createSystemSetting = async (req, res) => {
    try {
        const {
            key,
            value,
            type,
            description,
            isActive
        } = req.body;

        if (!key || value === undefined || !type) {
            return res.status(400).json({
                success: false,
                message: 'Key, value y type son obligatorios'
            });
        }

        const setting = await prisma.systemSetting.create({
            data: {
                key,
                value: String(value),
                type,
                description,
                isActive: isActive !== undefined ? Boolean(isActive) : true
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Configuración creada correctamente',
            data: setting
        });

    } catch (error) {
        console.error('Error al crear configuración:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear configuración'
        });
    }
};

// Actualizar configuración
const updateSystemSetting = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            key,
            value,
            type,
            description,
            isActive
        } = req.body;

        const setting = await prisma.systemSetting.update({
            where: {
                id: Number(id)
            },
            data: {
                key,
                value: value !== undefined ? String(value) : undefined,
                type,
                description,
                isActive
            }
        });

        return res.json({
            success: true,
            message: 'Configuración actualizada correctamente',
            data: setting
        });

    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar configuración'
        });
    }
};

// Actualizar solo el valor por key
const updateSystemSettingValueByKey = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El valor de la configuración es obligatorio'
            });
        }

        const setting = await prisma.systemSetting.update({
            where: {
                key
            },
            data: {
                value: String(value)
            }
        });

        return res.json({
            success: true,
            message: 'Valor de configuración actualizado correctamente',
            data: setting
        });

    } catch (error) {
        console.error('Error al actualizar valor de configuración:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar valor de configuración'
        });
    }
};

module.exports = {
    getSystemSettings,
    getSystemSettingByKey,
    createSystemSetting,
    updateSystemSetting,
    updateSystemSettingValueByKey
};