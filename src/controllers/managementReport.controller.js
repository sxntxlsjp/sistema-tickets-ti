const prisma = require('../config/prisma');
const puppeteer = require('puppeteer');
const {
    generateManagementReportHtml
} = require('../utils/managementReportTemplate.util');
const runtimeLogger = require('../utils/runtimeLogger.util');

// Single-flight por proceso (Sprint 20, Bloque K): evita que dos solicitudes
// concurrentes abran dos instancias de Chromium a la vez en un servidor de
// recursos limitados. Es contención local, no una cola — sin dependencias nuevas.
let isGeneratingReport = false;

const generateManagementReport = async (req, res) => {
    if (isGeneratingReport) {
        return res.status(409).json({
            message: 'Ya hay una generación de reporte en curso. Intenta nuevamente en unos segundos.'
        });
    }

    isGeneratingReport = true;

    try {

        const tickets = await prisma.ticket.findMany({
            where: {
                tenantId: req.tenantId
            },
            include: {
                requester: true,
                assignee: true,
                type: true,
                priority: true,
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
                ticket.priorityId &&
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
                groupBy(tickets, ticket => ticket.priority?.name);

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

            let browser;

            try {
                browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                    ]
                });
            } catch (launchError) {
                runtimeLogger.logError('report.puppeteer_launch_failed', launchError);
                throw launchError;
            }

            let pdfBuffer;

            try {
                const page = await browser.newPage();

                await page.setContent(html, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });

                await Promise.race([
                    page.evaluate(async () => {
                        if (document.fonts?.ready) {
                            await document.fonts.ready;
                        }
                    }),
                    new Promise(resolve => setTimeout(resolve, 5000))
                ]);

                pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: true
                });
            } finally {
                try {
                    await browser.close();
                } catch (closeError) {
                    runtimeLogger.logError('report.puppeteer_close_failed', closeError);
                }
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="reporte-gerencial-ti.pdf"'
            );

            return res.send(pdfBuffer);

    } catch (error) {

        console.error('[generateManagementReport]', error.message);

        return res.status(500).json({
            message: 'Error al generar reporte'
        });
    } finally {
        isGeneratingReport = false;
    }
};

module.exports = {
    generateManagementReport
};