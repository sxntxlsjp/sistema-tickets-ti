const { barChart, donutChart } = require('../utils/reportCharts');
const generateManagementReportHtml = ({ kpis, charts }) => {
    const today = new Date().toLocaleDateString('es-EC');
const toChartData = (data = {}, labelName = 'label') => {
    return Object.entries(data).map(([label, total]) => ({
        [labelName]: label,
        total
    }));
};

const chartsSection = `
    <h2 class="section-title">Indicadores Gráficos</h2>

    <div class="charts-grid">
        ${donutChart(
            'Distribución por Estado',
            toChartData(charts.ticketsByStatus, 'status'),
            'status',
            'total'
        )}

        ${donutChart(
            'Distribución por Prioridad',
            toChartData(charts.ticketsByPriority, 'priority'),
            'priority',
            'total'
        )}
    </div>

    <div class="charts-grid">
        ${barChart(
            'Tickets por Tipo',
            toChartData(charts.ticketsByType, 'type'),
            'type',
            'total'
        )}

        ${barChart(
            'Tickets por Departamento',
            toChartData(charts.ticketsByDepartment, 'department'),
            'department',
            'total'
        )}
    </div>

    <div class="charts-grid single">
        ${barChart(
            'Tickets por Responsable',
            toChartData(charts.ticketsByAssignee, 'responsible'),
            'responsible',
            'total'
        )}
    </div>
`;

const conclusions = [];

if (kpis.totalTickets === 0) {
    conclusions.push('No se registran tickets en el período analizado.');
} else {
    conclusions.push(`Durante el período analizado se registraron ${kpis.totalTickets} tickets en total.`);

    conclusions.push(`El porcentaje de cierre fue del ${kpis.closedRate}%, con ${kpis.closedTickets} tickets finalizados.`);

    conclusions.push(`El incumplimiento SLA fue del ${kpis.overdueRate}%, con ${kpis.overdueTickets} tickets vencidos.`);

    if (Number(kpis.satisfactionAverage) > 0) {
        conclusions.push(`La satisfacción promedio registrada fue de ${kpis.satisfactionAverage}/5 sobre ${kpis.satisfactionTotal} encuestas.`);
    } else {
        conclusions.push('No existen encuestas de satisfacción registradas para el período.');
    }
}

const conclusionsSection = `
    <section class="page">
        <h2 class="section-title">Conclusiones Ejecutivas</h2>

        <div class="panel">
            <ul class="executive-list">
                ${conclusions.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>

        <div class="footer">
            Las conclusiones fueron generadas automáticamente a partir de los indicadores del sistema.
        </div>
    </section>
`;
    const renderBarRows = (data) => {
        const values = Object.values(data);
        const max = values.length > 0 ? Math.max(...values) : 1;

        return Object.entries(data).map(([label, value]) => {
            const width = max > 0 ? (value / max) * 100 : 0;

            return `
                <div class="bar-row">
                    <div class="bar-label">
                        <span>${label}</span>
                        <strong>${value}</strong>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width:${width}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    };

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte Gerencial TI</title>

            <style>
                .executive-list {
                    margin: 0;
                    padding-left: 20px;
                }

                .executive-list li {
                    font-size: 13px;
                    line-height: 1.7;
                    color: #334155;
                    margin-bottom: 10px;
                }
            .section {
            margin-top: 28px;
            }

            .section h2 {
            font-size: 18px;
            color: #0f172a;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 18px;
            }

            .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-bottom: 18px;
            }

            .charts-grid.single {
            grid-template-columns: 1fr;
            }

            .chart-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 18px;
            page-break-inside: avoid;
            }

            .chart-card h3 {
            font-size: 14px;
            color: #111827;
            margin-bottom: 16px;
            }

            .bar-row {
            display: grid;
            grid-template-columns: 130px 1fr 40px;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 11px;
            }

            .bar-label {
            color: #374151;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            }

            .bar-track {
            height: 10px;
            background: #e5e7eb;
            border-radius: 999px;
            overflow: hidden;
            }

            .bar-fill {
            height: 100%;
            background: #1d4ed8;
            border-radius: 999px;
            }

            .bar-value {
            text-align: right;
            font-weight: 700;
            color: #111827;
            }

            .donut-wrapper {
            display: flex;
            align-items: center;
            gap: 18px;
            }

            .donut-total {
            font-size: 22px;
            font-weight: 700;
            fill: #111827;
            }

            .donut-subtitle {
            font-size: 10px;
            fill: #6b7280;
            }

            .legend {
            flex: 1;
            }

            .legend-item {
            display: grid;
            grid-template-columns: 12px 1fr auto;
            gap: 8px;
            align-items: center;
            font-size: 11px;
            margin-bottom: 8px;
            color: #374151;
            }

            .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 999px;
            }

            .empty-chart {
            color: #6b7280;
            font-size: 12px;
            }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    color: #0f172a;
                    background: #f8fafc;
                }

                .page {
                    padding: 40px;
                }

                .cover {
                    background: linear-gradient(135deg, #020617, #1e293b);
                    color: white;
                    height: 100vh;
                    padding: 60px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .cover h1 {
                    font-size: 42px;
                    margin-bottom: 10px;
                }

                .cover p {
                    color: #cbd5e1;
                    font-size: 18px;
                }

                .section-title {
                    font-size: 24px;
                    margin-bottom: 20px;
                    border-bottom: 3px solid #0f172a;
                    padding-bottom: 10px;
                }

                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 30px;
                }

                .kpi-card {
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
                }

                .kpi-card span {
                    color: #64748b;
                    font-size: 13px;
                }

                .kpi-card h2 {
                    font-size: 32px;
                    margin: 8px 0 0;
                }

                .grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                    margin-bottom: 30px;
                }

                .panel {
                    background: white;
                    border-radius: 18px;
                    padding: 24px;
                    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
                }

                .panel h3 {
                    margin-top: 0;
                    margin-bottom: 18px;
                }

                .executive-box {
                    background: white;
                    border-left: 6px solid #0f172a;
                    padding: 24px;
                    border-radius: 14px;
                    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
                    line-height: 1.7;
                }

                .risk {
                    color: #b91c1c;
                    font-weight: bold;
                }

                .good {
                    color: #15803d;
                    font-weight: bold;
                }

                .footer {
                    margin-top: 40px;
                    font-size: 12px;
                    color: #64748b;
                    text-align: center;
                }
            </style>
        </head>

        <body>

            <section class="cover">
                <div>
                    <h1>Reporte Ejecutivo de Mesa de Ayuda TI</h1>
                    <p>Informe gerencial para análisis de soporte, SLA y satisfacción del servicio.</p>
                </div>

                <div>
                    <p><strong>Fecha de generación:</strong> ${today}</p>
                    <p><strong>Sistema:</strong> Plataforma de Gestión de Tickets TI</p>
                </div>
            </section>

            <section class="page">
                <h2 class="section-title">Resumen Ejecutivo</h2>

                <div class="executive-box">
                    Durante el periodo analizado se registraron
                    <strong>${kpis.totalTickets}</strong> tickets.
                    El porcentaje de cierre actual es de
                    <strong>${kpis.closedRate}%</strong>,
                    mientras que el porcentaje de tickets vencidos por SLA es de
                    <strong class="${Number(kpis.overdueRate) > 20 ? 'risk' : 'good'}">
                        ${kpis.overdueRate}%
                    </strong>.
                    La satisfacción promedio reportada por los usuarios es de
                    <strong>${kpis.satisfactionAverage}/5</strong>
                    sobre un total de
                    <strong>${kpis.satisfactionTotal}</strong> evaluaciones.
                </div>

                <div class="footer">
                    Reporte generado automáticamente por el Sistema de Tickets TI
                </div>
            </section>

            <section class="page">
                <h2 class="section-title">Indicadores Clave</h2>

                <div class="kpi-grid">
                    <div class="kpi-card">
                        <span>Total Tickets</span>
                        <h2>${kpis.totalTickets}</h2>
                    </div>

                    <div class="kpi-card">
                        <span>Pendientes</span>
                        <h2>${kpis.pendingTickets}</h2>
                    </div>

                    <div class="kpi-card">
                        <span>En Revisión</span>
                        <h2>${kpis.inReviewTickets}</h2>
                    </div>

                    <div class="kpi-card">
                        <span>Finalizados</span>
                        <h2>${kpis.closedTickets}</h2>
                    </div>

                    <div class="kpi-card">
                        <span>SLA Vencidos</span>
                        <h2>${kpis.overdueTickets}</h2>
                    </div>

                    <div class="kpi-card">
                        <span>% Cierre</span>
                        <h2>${kpis.closedRate}%</h2>
                    </div>

                    <div class="kpi-card">
                        <span>% SLA Vencido</span>
                        <h2>${kpis.overdueRate}%</h2>
                    </div>

                    <div class="kpi-card">
                        <span>Satisfacción</span>
                        <h2>${kpis.satisfactionAverage}/5</h2>
                    </div>
                </div>
            </section>
            <section class="page">
                ${chartsSection}

                <div class="footer">
                    Este reporte permite identificar distribución de incidencias, concentración de carga operativa y posibles cuellos de botella.
                </div>
            </section>
            ${conclusionsSection}



        </body>
        </html>
    `;
};

module.exports = {
    generateManagementReportHtml
};