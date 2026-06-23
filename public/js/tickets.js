const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token) {
    window.location.href = 'index.html';
}

let tickets = [];

const statusBadge = (status) => {
    const styles = {
        EN_REVISION: 'bg-blue-100 text-blue-700',
        PENDIENTE: 'bg-yellow-100 text-yellow-700',
        FINALIZADO: 'bg-green-100 text-green-700'
    };

    const labels = {
        EN_REVISION: 'En revisión',
        PENDIENTE: 'Pendiente',
        FINALIZADO: 'Finalizado'
    };

    return `
        <span class="px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}">
            ${labels[status]}
        </span>
    `;
};
const slaBadge = (ticket) => {
    if (ticket.status === 'FINALIZADO') {
        return `
            <span class="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600">
                ⚪ Resuelto
            </span>
        `;
    }

    if (!ticket.slaDueAt) {
        return `
            <span class="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600">
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
            <span class="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                🔴 Vencido
            </span>
        `;
    }

    if (diffHours <= 1) {
        return `
            <span class="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                🟡 Por vencer
            </span>
        `;
    }

    return `
        <span class="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
            🟢 En tiempo
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
                <td class="p-4 whitespace-nowrap font-semibold">${ticket.ticketNumber}</td>
                <td class="p-4">${ticket.subject}</td>
                <td class="p-4 whitespace-nowrap">${ticket.type?.name || '-'}</td>
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
                       class="text-slate-900 font-semibold hover:underline">
                        Ver detalle
                    </a>
                </td>
            </tr>
        `;
    });
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
