const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

const user = JSON.parse(localStorage.getItem('user'));
let statusChartInstance = null;
let priorityChartInstance = null;

if (!user || user.role !== 'ADMIN') {
    window.location.href = 'user-home.html';
}

const statusLabels = {
    EN_REVISION: 'En revisión',
    PENDIENTE: 'Pendiente',
    FINALIZADO: 'Finalizado'
};

const priorityLabels = {
    BAJA: 'Baja',
    MEDIA: 'Media',
    ALTA: 'Alta'
};

const loadDashboard = async (range = 'all') => {
    setActiveRangeButton(range);
    const response = await fetch(`${API_URL}/dashboard/summary?range=${range}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    loadAdminAlerts();
    document.getElementById('totalTickets').textContent = data.totalTickets;
    document.getElementById('openTickets').textContent = data.openTickets;
    document.getElementById('pendingTickets').textContent = data.pendingTickets;
    document.getElementById('closedTickets').textContent = data.closedTickets;
    document.getElementById('overdueTickets').textContent = data.overdueTickets;

    document.getElementById('satisfactionAverage').textContent =
        `${Number(data.satisfactionAverage).toFixed(1)} ⭐`;

const statusData = data.ticketsByStatus.map(item => ({
    label: statusLabels[item.status] || item.status,
    total: item._count
}));

const priorityData = data.ticketsByPriority.map(item => ({
    label: priorityLabels[item.priority] || item.priority,
    total: item._count
}));

renderChart(
    'statusChart',
    statusData.map(item => item.label),
    statusData.map(item => item.total),
    'doughnut'
);

renderChart(
    'priorityChart',
    priorityData.map(item => item.label),
    priorityData.map(item => item.total),
    'bar'
);

    renderBars(
        'ticketsByType',
        data.ticketsByType.map(item => ({
            label: item.typeName,
            total: item.total
        }))
    );

    renderBars(
        'ticketsByDepartment',
        data.ticketsByDepartment.map(item => ({
            label: item.department,
            total: item.total
        }))
    );

    renderLatestTickets(data.latestTickets);
    renderLatestSatisfactions(data.latestSatisfactions);
};
const setActiveRangeButton = (range) => {
    document.querySelectorAll('.range-btn').forEach(button => {
        button.classList.remove('bg-slate-900', 'text-white');
        button.classList.add('bg-white', 'text-slate-700');
    });

    const activeButton = document.querySelector(`[data-range="${range}"]`);

    if (activeButton) {
        activeButton.classList.remove('bg-white', 'text-slate-700');
        activeButton.classList.add('bg-slate-900', 'text-white');
    }
};
const loadAdminAlerts = async () => {
    const container = document.getElementById('adminAlertsContainer');

    if (!container) return;

    const response = await fetch(`${API_URL}/dashboard/my-alerts`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok || data.totalPendingAssigned === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="bg-amber-50 border border-amber-200 rounded-2xl shadow p-6">

            <div class="flex justify-between items-start mb-4">

                <div>
                    <h3 class="text-xl font-bold text-amber-800">
                        🔔 Atención requerida
                    </h3>

                    <p class="text-amber-700 mt-1">
                        Tienes ${data.totalPendingAssigned} ticket(s) pendiente(s) asignado(s).
                    </p>
                </div>

                <span class="bg-amber-200 text-amber-800 px-4 py-2 rounded-full font-bold">
                    ${data.totalPendingAssigned}
                </span>

            </div>

            <div class="space-y-3">
                ${data.tickets.map(ticket => `
                    <a href="ticket-detail.html?id=${ticket.id}"
                       class="block bg-white border border-amber-100 rounded-xl p-4 hover:bg-amber-100 transition">

                        <div class="flex justify-between">

                            <div>
                                <p class="font-bold text-slate-800">
                                    ${ticket.ticketNumber}
                                </p>

                                <p class="text-slate-600">
                                    ${ticket.subject}
                                </p>

                                <p class="text-sm text-slate-500 mt-1">
                                    ${ticket.type?.name || '-'} · ${ticket.requester?.name || '-'}
                                </p>
                            </div>

                            <div class="text-right">
                                <p class="font-semibold text-amber-700">
                                    Pendiente
                                </p>

                                <p class="text-xs text-slate-500">
                                    ${new Date(ticket.createdAt).toLocaleDateString('es-EC')}
                                </p>
                            </div>

                        </div>

                    </a>
                `).join('')}
            </div>

        </div>
    `;
};
const renderChart = (canvasId, labels, values, chartType = 'doughnut') => {
    const ctx = document.getElementById(canvasId);

    if (!ctx) return;

    if (canvasId === 'statusChart' && statusChartInstance) {
        statusChartInstance.destroy();
    }

    if (canvasId === 'priorityChart' && priorityChartInstance) {
        priorityChartInstance.destroy();
    }

    const chart = new Chart(ctx, {
        type: chartType,
        data: {
            labels,
            datasets: [{
                data: values,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    if (canvasId === 'statusChart') {
        statusChartInstance = chart;
    }

    if (canvasId === 'priorityChart') {
        priorityChartInstance = chart;
    }
};
const renderBars = (containerId, items) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-slate-500">Sin datos disponibles</p>';
        return;
    }

    const max = Math.max(...items.map(item => item.total));

    items.forEach(item => {
        const width = max > 0 ? (item.total / max) * 100 : 0;

        container.innerHTML += `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium text-slate-700">${item.label}</span>
                    <span class="font-bold">${item.total}</span>
                </div>

                <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div class="bg-slate-900 h-3 rounded-full" style="width: ${width}%"></div>
                </div>
            </div>
        `;
    });
};

const renderLatestTickets = (tickets) => {
    const container = document.getElementById('latestTickets');
    container.innerHTML = '';

    tickets.forEach(ticket => {
        container.innerHTML += `
            <a href="ticket-detail.html?id=${ticket.id}"
               class="block border rounded-xl p-4 hover:bg-slate-50">

                <div class="flex justify-between">
                    <div>
                        <p class="font-bold">${ticket.ticketNumber}</p>
                        <p class="text-slate-600">${ticket.subject}</p>
                        <p class="text-sm text-slate-500">
                            ${ticket.requester?.name || '-'} · ${ticket.requester?.department || 'Sin departamento'}
                        </p>
                    </div>

                    <div class="text-right">
                        <p class="text-sm font-semibold">
                            ${statusLabels[ticket.status] || ticket.status}
                        </p>
                        <p class="text-xs text-slate-500">
                            ${new Date(ticket.createdAt).toLocaleDateString('es-EC')}
                        </p>
                    </div>
                </div>

            </a>
        `;
    });
};

const renderLatestSatisfactions = (items) => {
    const container = document.getElementById('latestSatisfactions');
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-slate-500">Sin evaluaciones registradas</p>';
        return;
    }

    items.forEach(item => {
        container.innerHTML += `
            <div class="border rounded-xl p-4">
                <div class="flex justify-between mb-2">
                    <p class="font-bold">${item.ticket.ticketNumber}</p>
                    <p class="font-bold">${'⭐'.repeat(item.rating)}</p>
                </div>

                <p class="text-slate-600">${item.ticket.subject}</p>

                <p class="text-sm text-slate-500 mt-1">
                    ${item.user.name}
                </p>

                ${
                    item.comment
                        ? `<p class="mt-2 text-sm italic text-slate-700">"${item.comment}"</p>`
                        : ''
                }
            </div>
        `;
    });
};

const exportManagementReport = async () => {

    try {

        const response = await fetch(
            `${API_URL}/management-report`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('No se pudo generar el reporte');
        }

        const blob = await response.blob();

        const url =
            window.URL.createObjectURL(blob);

        const link =
            document.createElement('a');

        link.href = url;

        link.download =
            `Reporte-Gerencial-TI-${new Date().toISOString().split('T')[0]}.pdf`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);

    } catch (error) {

        console.error(error);

        alert(
            'Ocurrió un error al generar el reporte'
        );
    }
};

document
    .getElementById('exportManagementReportBtn')
    ?.addEventListener(
        'click',
        exportManagementReport
    );

    
loadDashboard('all');