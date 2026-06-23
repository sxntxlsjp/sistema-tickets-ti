const prisma = require('../config/prisma');
const puppeteer = require('puppeteer');
const {
    generateManagementReportHtml
} = require('../utils/managementReportTemplate.util');

const generateManagementReport = async (req, res) => {
    try {

        const tickets = await prisma.ticket.findMany({
            include: {
                requester: true,
                assignee: true,
                type: true,
                satisfaction: true
            }
        });

        const totalTickets = tickets.length;

        const pendingTickets =
            tickets.filter(ticket => ticket.status === 'PENDIENTE').length;

        const inReviewTickets =
            tickets.filter(ticket => ticket.status === 'EN_REVISION').length;

        const closedTickets =
            tickets.filter(ticket => ticket.status === 'FINALIZADO').length;

        const overdueTickets =
            tickets.filter(ticket =>
                ticket.status !== 'FINALIZADO' &&
                ticket.slaDueAt &&
                new Date(ticket.slaDueAt) < new Date()
            ).length;

        const closedRate =
            totalTickets > 0
                ? ((closedTickets / totalTickets) * 100).toFixed(1)
                : 0;

        const overdueRate =
            totalTickets > 0
                ? ((overdueTickets / totalTickets) * 100).toFixed(1)
                : 0;

        const satisfactions =
            tickets
                .map(ticket => ticket.satisfaction)
                .filter(Boolean);

        const satisfactionAverage =
            satisfactions.length > 0
                ? (
                    satisfactions.reduce((sum, item) => sum + item.rating, 0) /
                    satisfactions.length
                ).toFixed(1)
                : 0;

            const groupBy = (items, getKey) => {
                return items.reduce((acc, item) => {
                    const key = getKey(item) || 'Sin definir';

                    acc[key] = (acc[key] || 0) + 1;

                    return acc;
                }, {});
            };

            const ticketsByStatus =
                groupBy(tickets, ticket => ticket.status);

            const ticketsByPriority =
                groupBy(tickets, ticket => ticket.priority);

            const ticketsByType =
                groupBy(tickets, ticket => ticket.type?.name);

            const ticketsByAssignee =
                groupBy(tickets, ticket => ticket.assignee?.name);

            const ticketsByDepartment =
                groupBy(tickets, ticket => ticket.requester?.department);

            const html = generateManagementReportHtml({
                kpis: {
                    totalTickets,
                    pendingTickets,
                    inReviewTickets,
                    closedTickets,
                    overdueTickets,
                    closedRate,
                    overdueRate,
                    satisfactionAverage,
                    satisfactionTotal: satisfactions.length
                },
                charts: {
                    ticketsByStatus,
                    ticketsByPriority,
                    ticketsByType,
                    ticketsByAssignee,
                    ticketsByDepartment
                }
            });

            const browser = await puppeteer.launch({
                headless: true
            });

            const page = await browser.newPage();

            await page.setContent(html, {
                waitUntil: 'networkidle0'
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true
            });

            await browser.close();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="reporte-gerencial-ti.pdf"'
            );

            return res.send(pdfBuffer);

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: 'Error al generar reporte'
        });
    }
};

module.exports = {
    generateManagementReport
};