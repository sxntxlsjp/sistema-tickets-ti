const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { getTenantsForUser } = require('../utils/tenant.util');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Correo y contraseña son obligatorios'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        const tenants = await getTenantsForUser(user);

            return res.json({
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isSuperAdmin: user.isSuperAdmin,
                    department: user.department,
                    jobTitle: user.jobTitle,
                    phone: user.phone,
                    profileImage: user.profileImage
                },
                tenants
            });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

const me = async (req, res) => {
    return res.json({
        message: 'Usuario autenticado',
        user: req.user
    });
};

const getMyTenants = async (req, res) => {
    try {
        const tenants = await getTenantsForUser(req.user);

        return res.json({
            tenants
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al obtener las empresas del usuario'
        });
    }
};

module.exports = {
    login,
    me,
    getMyTenants
};