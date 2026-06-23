const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

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
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

            return res.json({
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    jobTitle: user.jobTitle,
                    phone: user.phone,
                    profileImage: user.profileImage
                }
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

module.exports = {
    login,
    me
};