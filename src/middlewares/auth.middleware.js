const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Token no proporcionado'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (error, decoded) => {
        if (error) {
            return res.status(403).json({
                message: 'Token inválido o expirado'
            });
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user || !user.isActive) {
                return res.status(401).json({
                    message: 'Sesión inválida'
                });
            }

            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin
            };

            next();

        } catch (dbError) {
            console.error(dbError);
            return res.status(500).json({
                message: 'Error al validar la sesión'
            });
        }
    });
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};
