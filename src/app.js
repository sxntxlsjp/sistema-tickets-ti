const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const ticketTypeRoutes = require('./routes/ticketType.routes');
const ticketRoutes = require('./routes/ticket.routes');
const ticketListRoutes = require('./routes/ticketList.routes');
const ticketStatusRoutes = require('./routes/ticketStatus.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const ticketCommentRoutes = require('./routes/ticketComment.routes');
const ticketDetailRoutes = require('./routes/ticketDetail.routes');
const path = require('path');
const fs = require('fs');
const ticketAttachmentRoutes = require('./routes/ticketAttachment.routes');
const ticketSatisfactionRoutes = require('./routes/ticketSatisfaction.routes');
const ticketAssignRoutes = require('./routes/ticketAssign.routes');
const profileRoutes = require('./routes/profile.routes');
const managementReportRoutes = require('./routes/managementReport.routes');
const countryRoutes = require('./routes/country.routes');

const app = express();
const ticketUploadsPath = path.join(__dirname, 'uploads');
const profileUploadsPath = path.join(__dirname, '../public/uploads/profiles');

fs.mkdirSync(ticketUploadsPath, { recursive: true });
fs.mkdirSync(profileUploadsPath, { recursive: true });
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));
app.use(
    '/uploads/profiles',
    express.static(profileUploadsPath)
);

app.use(
    '/uploads',
    express.static(ticketUploadsPath)
);

app.get('/debug/uploads', (req, res) => {
    res.json({
        ticketUploadsPath,
        profileUploadsPath,
        ticketFiles: fs.existsSync(ticketUploadsPath)
            ? fs.readdirSync(ticketUploadsPath)
            : [],
        profileFiles: fs.existsSync(profileUploadsPath)
            ? fs.readdirSync(profileUploadsPath)
            : []
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'API Sistema de Tickets funcionando correctamente'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ticket-types', ticketTypeRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets', ticketListRoutes);
app.use('/api/tickets', ticketStatusRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tickets', ticketCommentRoutes);
app.use('/api/tickets', ticketDetailRoutes);
app.use('/api/tickets', ticketAttachmentRoutes);
app.use('/api/tickets', ticketSatisfactionRoutes);
app.use('/api/tickets', ticketAssignRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', managementReportRoutes);
app.use('/api/countries', countryRoutes);

module.exports = app;
