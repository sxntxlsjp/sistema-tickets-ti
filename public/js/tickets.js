const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token) {
    window.location.href = 'index.html';
}

let tickets = [];

const statusBadge = (status) => {
    const styles = {
        EN_REVISION: 'badge-blue',
        PENDIENTE: 'badge-warning',
        FINALIZADO: 'badge-success'
    };

    const labels = {
        EN_REVISION: 'En revisión',
        PENDIENTE: 'Pendiente',
        FINALIZADO: 'Finalizado'
    };

    return `
        <span class="badge ${styles[status]}">
            ${labels[status]}
        </span>
    `;
};
const slaBadge = (ticket) => {
    if (ticket.status === 'FINALIZADO') {
        return `
            <span class="badge badge-neutral">
                <i data-lucide="circle" class="icon-sm"></i>
                Resuelto
            </span>
        `;
    }

    if (!ticket.slaDueAt) {
        return `
            <span class="badge badge-neutral">
                Sin SLA
            </span>
        `;
    }

    const now = new Date();
    const dueDate = new Date(ticket.slaDueAt);
    const diffMs = dueDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
        return `
            <span class="badge badge-danger">
                <i data-lucide="alert-circle" class="icon-sm"></i>
                Vencido
            </span>
        `;
    }

    if (diffHours <= 1) {
        return `
            <span class="badge badge-warning">
                <i data-lucide="clock" class="icon-sm"></i>
                Por vencer
            </span>
        `;
    }

    return `
        <span class="badge badge-success">
            <i data-lucide="check-circle-2" class="icon-sm"></i>
            En tiempo
        </span>
    `;
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-EC');
};

const renderTickets = (data) => {
    const table = document.getElementById('ticketsTable');
    table.innerHTML = '';

    data.forEach(ticket => {
        table.innerHTML += `
            <tr class="hover:bg-slate-50">
<td class="p-4 min-w-[320px]">
    <div class="space-y-2">

        <div>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                ${ticket.ticketNumber}
            </span>
        </div>

        <div class="font-semibold text-slate-800">
            ${ticket.subject}
        </div>

        <div class="flex flex-wrap gap-2">
            <span class="badge badge-cyan">
                <i data-lucide="tag" class="icon-sm"></i>
                ${ticket.type?.name || '—'}
            </span>

            ${
                ticket.ticketSubtype
                    ? `
                        <span class="badge badge-neutral">
                            ${ticket.ticketSubtype.name}
                        </span>
                    `
                    : ''
            }
        </div>

    </div>
</td>

                <td class="p-4 whitespace-nowrap">
                    ${
                        ticket.priority
                            ? `
                                <span
                                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white"
                                    style="background:${ticket.priority.color}">
                                    ${ticket.priority.name}
                                </span>
                            `
                            : `
                                <span class="badge badge-neutral">
                                    Sin asignar
                                </span>
                            `
                    }
                </td>
                <td class="p-4 whitespace-nowrap">
                    ${
                        ticket.country
                            ? `
                                <span class="inline-flex items-center">
                                    <img
                                        src="https://flagcdn.com/24x18/${ticket.country.code.toLowerCase()}.png"
                                        alt="${ticket.country.name}"
                                        class="w-6 h-4 rounded-sm mr-2 object-cover"
                                    >
                                    ${ticket.country.name}
                                </span>
                            `
                            : '—'
                    }
                </td>
                    ${
                        user.role === 'ADMIN'
                            ? `<td class="p-4 whitespace-nowrap">${ticket.requester?.name || '-'}</td>`
                            : ''
                    }
                <td class="p-4 whitespace-nowrap">${ticket.assignee?.name || 'Sin responsable'}</td>
                <td class="p-4 whitespace-nowrap">${statusBadge(ticket.status)}</td>
                <td class="p-4 whitespace-nowrap">${slaBadge(ticket)}</td>
                <td class="p-4 whitespace-nowrap">${formatDate(ticket.createdAt)}</td>
                <td class="p-4">
                    <a href="ticket-detail.html?id=${ticket.id}"
                       class="font-semibold hover:underline" style="color: var(--color-primary-blue);">
                        Ver detalle
                    </a>
                </td>
            </tr>
        `;
    });

    refreshIcons();
};
const populateFilters = (ticketsData) => {
    const typeFilter = document.getElementById('typeFilter');
    const assigneeFilter = document.getElementById('assigneeFilter');

    const currentType = typeFilter.value;
    const currentAssignee = assigneeFilter.value;

    const types = [
        ...new Map(
            ticketsData
                .filter(ticket => ticket.type)
                .map(ticket => [
                    ticket.type.id,
                    ticket.type
                ])
        ).values()
    ];

    const assignees = [
        ...new Map(
            ticketsData
                .filter(ticket => ticket.assignee)
                .map(ticket => [
                    ticket.assignee.id,
                    ticket.assignee
                ])
        ).values()
    ];

    typeFilter.innerHTML =
        '<option value="">Todos los tipos</option>';

    types.forEach(type => {
        typeFilter.innerHTML += `
            <option value="${type.id}">
                ${type.name}
            </option>
        `;
    });

    assigneeFilter.innerHTML =
        '<option value="">Todos los responsables</option>';

    assignees.forEach(assignee => {
        assigneeFilter.innerHTML += `
            <option value="${assignee.id}">
                ${assignee.name}
            </option>
        `;
    });

    typeFilter.value = currentType;
    assigneeFilter.value = currentAssignee;
};

const loadTickets = async () => {

    const user = JSON.parse(
        localStorage.getItem('user')
    );

    const endpoint =
        user.role === 'ADMIN'
            ? `${API_URL}/tickets`
            : `${API_URL}/tickets/my`;

    const response = await fetch(
        endpoint,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    tickets = await response.json();

    populateFilters(tickets);
    applyFilters();
};

const applyFilters = () => {
    const searchValue =
        document.getElementById('searchInput').value.toLowerCase();

    const statusValue =
        document.getElementById('statusFilter').value;

    const priorityValue =
        document.getElementById('priorityFilter').value;

    const typeValue =
        document.getElementById('typeFilter').value;

    const assigneeValue =
        document.getElementById('assigneeFilter').value;

    const filtered = tickets.filter(ticket => {

        const matchesSearch =
            ticket.ticketNumber.toLowerCase().includes(searchValue) ||
            ticket.subject.toLowerCase().includes(searchValue) ||
            ticket.status.toLowerCase().includes(searchValue) ||
            ticket.requester?.name?.toLowerCase().includes(searchValue) ||
            ticket.assignee?.name?.toLowerCase().includes(searchValue);

        const matchesStatus =
            !statusValue || ticket.status === statusValue;

        const matchesPriority =
            !priorityValue || ticket.priority === priorityValue;

        const matchesType =
            !typeValue || String(ticket.typeId) === typeValue;

        const matchesAssignee =
            !assigneeValue || String(ticket.assignedTo) === assigneeValue;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesType &&
            matchesAssignee
        );
    });

    renderTickets(filtered);
};

[
    'searchInput',
    'statusFilter',
    'priorityFilter',
    'typeFilter',
    'assigneeFilter'
].forEach(id => {
    document.getElementById(id).addEventListener('input', applyFilters);
    document.getElementById(id).addEventListener('change', applyFilters);
});

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('assigneeFilter').value = '';

    applyFilters();
});


const configureTableByRole = () => {
    const requesterHeader = document.getElementById('requesterHeader');

    if (user.role === 'USER' && requesterHeader) {
        requesterHeader.style.display = 'none';
    }
};
configureTableByRole();
loadTickets();
