const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

const user = JSON.parse(localStorage.getItem('user'));
const chartInstances = {};

if (!user || user.role !== 'ADMIN') {
    window.location.href = 'user-home.html';
}

const statusLabels = {
    EN_REVISION: 'En revisión',
    PENDIENTE: 'Pendiente',
    FINALIZADO: 'Finalizado'
};

const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
};

const applyChartTheme = () => {
    if (typeof Chart === 'undefined') return;

    const isDark = typeof resolveTheme === 'function' && resolveTheme(getThemePreference()) === 'dark';

    Chart.defaults.color = isDark ? '#CBD5E1' : '#475569';
    Chart.defaults.borderColor = isDark ? '#22324A' : '#E2E8F0';
    Chart.defaults.font.family = "'Poppins', ui-sans-serif, system-ui, sans-serif";
};

const loadDashboard = async (range = 'all') => {
    setActiveRangeButton(range);
    applyChartTheme();

    let data;

    try {
        const response = await fetch(`${API_URL}/dashboard/summary?range=${range}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('No se pudo cargar el dashboard');
        }

        data = await response.json();
    } catch (error) {
        console.error(error);
        return;
    }

    loadAdminAlerts();

    setText('totalTickets', data.totalTickets ?? 0);
    setText('withoutPriorityTickets', data.withoutPriorityTickets ?? 0);
    setText('openTickets', data.openTickets ?? 0);
    setText('pendingTickets', data.pendingTickets ?? 0);
    setText('closedTickets', data.closedTickets ?? 0);

    setText('slaNotStarted', data.slaNotStarted ?? 0);
    setText('slaOnTime', data.slaOnTime ?? 0);
    setText('slaDueSoon', data.slaDueSoon ?? 0);
    setText('slaOverdue', data.slaOverdue ?? 0);

    setText('createdToday', data.createdToday ?? 0);
    setText('createdThisWeek', data.createdThisWeek ?? 0);
    setText('closedThisWeek', data.closedThisWeek ?? 0);
    setText('resolutionRate', `${data.resolutionRate ?? 0}%`);
    setText(
        'avgResolutionMinutes',
        data.avgResolutionMinutes !== null && data.avgResolutionMinutes !== undefined
            ? formatMinutes(data.avgResolutionMinutes)
            : '-'
    );

    const satisfactionEl = document.getElementById('satisfactionAverage');
    if (satisfactionEl) {
        satisfactionEl.innerHTML = `${Number(data.satisfactionAverage || 0).toFixed(1)} <i data-lucide="star" class="inline icon-sm" style="fill: currentColor;"></i>`;
        refreshIcons();
    }

    const statusColors = {
        EN_REVISION: '#2563EB',
        PENDIENTE: '#F59E0B',
        FINALIZADO: '#10B981'
    };

    const statusData = (data.ticketsByStatus || []).map(item => ({
        label: statusLabels[item.status] || item.status,
        total: item._count,
        color: statusColors[item.status] || '#94A3B8'
    }));

    renderChart(
        'statusChart',
        statusData.map(item => item.label),
        statusData.map(item => item.total),
        'doughnut',
        statusData.map(item => item.color)
    );

    const priorityData = data.ticketsByPriority || [];

    renderChart(
        'priorityChart',
        priorityData.map(item => item.priorityName),
        priorityData.map(item => item.total),
        'bar',
        priorityData.map(item => item.color)
    );

    renderChart(
        'slaChart',
        ['No iniciado', 'En tiempo', 'Por vencer', 'Vencido'],
        [data.slaNotStarted || 0, data.slaOnTime || 0, data.slaDueSoon || 0, data.slaOverdue || 0],
        'doughnut',
        ['#94A3B8', '#10B981', '#F59E0B', '#EF4444']
    );

    renderBars(
        'ticketsByType',
        (data.ticketsByType || []).map(item => ({ label: item.typeName, total: item.total }))
    );

    renderBars(
        'ticketsBySubtype',
        (data.ticketsBySubtype || []).map(item => ({ label: item.subtypeName, total: item.total }))
    );

    renderBars(
        'ticketsByCountry',
        (data.ticketsByCountry || []).map(item => ({
            label: `${item.flagEmoji ? item.flagEmoji + ' ' : ''}${item.countryName}`,
            total: item.total
        }))
    );

    renderBars(
        'ticketsByAssignee',
        (data.ticketsByAssignee || []).map(item => ({ label: item.assigneeName, total: item.total }))
    );

    renderLatestTickets(data.latestTickets || []);
    renderLatestSatisfactions(data.latestSatisfactions || []);
    renderOverdueTickets(data.overdueTicketsList || []);
};

const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} d`;
};

const setActiveRangeButton = (range) => {
    document.querySelectorAll('.range-btn').forEach(button => {
        button.classList.remove('btn-secondary');
        button.classList.add('btn-outline');
    });

    const activeButton = document.querySelector(`[data-range="${range}"]`);

    if (activeButton) {
        activeButton.classList.remove('btn-outline');
        activeButton.classList.add('btn-secondary');
    }
};

const loadAdminAlerts = async () => {
    const container = document.getElementById('adminAlertsContainer');

    if (!container) return;

    let data;

    try {
        const response = await fetch(`${API_URL}/dashboard/my-alerts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        data = await response.json();

        if (!response.ok || data.totalPendingAssigned === 0) {
            container.innerHTML = '';
            return;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="card" style="background-color: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.35);">

            <div class="flex justify-between items-start mb-4">

                <div class="flex items-start gap-3">
                    <i data-lucide="bell-ring" style="color: var(--color-warning);"></i>

                    <div>
                        <h3 class="text-xl font-bold" style="color: var(--text-primary);">
                            Atención requerida
                        </h3>

                        <p class="mt-1" style="color: var(--text-secondary);">
                            Tienes ${data.totalPendingAssigned} ticket(s) pendiente(s) asignado(s).
                        </p>
                    </div>
                </div>

                <span class="badge badge-warning" style="font-size: var(--font-size-base); padding: var(--space-2) var(--space-4);">
                    ${data.totalPendingAssigned}
                </span>

            </div>

            <div class="space-y-3">
                ${data.tickets.map(ticket => `
                    <a href="ticket-detail.html?id=${ticket.id}"
                       class="block card card-compact hover:shadow-md transition">

                        <div class="flex justify-between">

                            <div>
                                <p class="font-bold" style="color: var(--text-primary);">
                                    ${escapeHtml(ticket.ticketNumber)}
                                </p>

                                <p style="color: var(--text-secondary);">
                                    ${escapeHtml(ticket.subject)}
                                </p>

                                <p class="text-sm mt-1" style="color: var(--text-muted);">
                                    ${escapeHtml(ticket.type?.name || '-')} · ${escapeHtml(ticket.requester?.name || '-')}
                                </p>
                            </div>

                            <div class="text-right">
                                <p class="font-semibold" style="color: var(--color-warning);">
                                    Pendiente
                                </p>

                                <p class="text-xs" style="color: var(--text-muted);">
                                    ${new Date(ticket.createdAt).toLocaleDateString('es-EC')}
                                </p>
                            </div>

                        </div>

                    </a>
                `).join('')}
            </div>

        </div>
    `;

    refreshIcons();
};

const renderChart = (canvasId, labels, values, chartType = 'doughnut', colors = null) => {
    const ctx = document.getElementById(canvasId);

    if (!ctx) return;

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const hasData = values.some(value => value > 0);

    chartInstances[canvasId] = new Chart(ctx, {
        type: chartType,
        data: {
            labels: hasData ? labels : ['Sin datos'],
            datasets: [{
                data: hasData ? values : [1],
                backgroundColor: hasData
                    ? (colors || undefined)
                    : ['#E2E8F0'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    display: hasData
                },
                tooltip: {
                    enabled: hasData
                }
            }
        }
    });
};

const renderBars = (containerId, items) => {
    const container = document.getElementById(containerId);
    if (!container) return;
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
                    <span class="font-medium text-slate-700">${escapeHtml(item.label)}</span>
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
    if (!container) return;
    container.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<p class="text-slate-500">Sin tickets registrados</p>';
        return;
    }

    tickets.forEach(ticket => {
        container.innerHTML += `
            <a href="ticket-detail.html?id=${ticket.id}"
               class="block border rounded-xl p-4 hover:bg-slate-50">

                <div class="flex justify-between">
                    <div>
                        <p class="font-bold">${escapeHtml(ticket.ticketNumber)}</p>
                        <p class="text-slate-600">${escapeHtml(ticket.subject)}</p>
                        <p class="text-sm text-slate-500">
                            ${escapeHtml(ticket.requester?.name || '-')} · ${escapeHtml(ticket.type?.name || '-')}
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
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-slate-500">Sin evaluaciones registradas</p>';
        return;
    }

    items.forEach(item => {
        container.innerHTML += `
            <div class="border rounded-xl p-4">
                <div class="flex justify-between mb-2">
                    <p class="font-bold">${escapeHtml(item.ticket.ticketNumber)}</p>
                    <p class="font-bold flex items-center" style="color: var(--color-warning);">
                        ${'<i data-lucide="star" class="icon-sm" style="fill: currentColor;"></i>'.repeat(item.rating)}
                    </p>
                </div>

                <p class="text-slate-600">${escapeHtml(item.ticket.subject)}</p>

                <p class="text-sm text-slate-500 mt-1">
                    ${escapeHtml(item.user.name)}
                </p>

                ${
                    item.comment
                        ? `<p class="mt-2 text-sm italic text-slate-700">"${escapeHtml(item.comment)}"</p>`
                        : ''
                }
            </div>
        `;
    });

    refreshIcons();
};

const renderOverdueTickets = (tickets) => {
    const container = document.getElementById('overdueTicketsList');
    if (!container) return;
    container.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<p class="text-slate-500">No hay tickets vencidos</p>';
        return;
    }

    tickets.forEach(ticket => {
        const color = ticket.priority?.color || '#EF4444';

        container.innerHTML += `
            <a href="ticket-detail.html?id=${ticket.id}"
               class="block border rounded-xl p-4 hover:bg-slate-50">

                <div class="flex justify-between">
                    <div>
                        <p class="font-bold">${escapeHtml(ticket.ticketNumber)}</p>
                        <p class="text-slate-600">${escapeHtml(ticket.subject)}</p>
                        <p class="text-sm text-slate-500">
                            ${escapeHtml(ticket.assignee?.name || 'Sin asignar')}
                        </p>
                    </div>

                    <div class="text-right">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold text-white" style="background-color: ${escapeHtml(color)}">
                            ${escapeHtml(ticket.priority?.name || 'Sin prioridad')}
                        </span>
                        <p class="text-xs text-slate-500 mt-1">
                            Venció: ${new Date(ticket.slaDueAt).toLocaleString('es-EC')}
                        </p>
                    </div>
                </div>

            </a>
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

document.addEventListener('themechange', () => {
    const activeRange = document.querySelector('.range-btn.btn-secondary')?.dataset.range || 'all';
    loadDashboard(activeRange);
});

loadDashboard('all');
