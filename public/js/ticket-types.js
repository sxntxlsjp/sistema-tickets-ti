const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
    window.location.href = 'index.html';
}

if (user.role !== 'ADMIN') {
    window.location.href = 'tickets.html';
}

const ticketTypeForm = document.getElementById('ticketTypeForm');
const ticketTypesList = document.getElementById('ticketTypesList');

const loadTicketTypes = async () => {
    const response = await fetch(`${API_URL}/ticket-types`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json();
    const ticketTypes = result.data || result;

    ticketTypesList.innerHTML = '';

    ticketTypes.forEach(type => {
        ticketTypesList.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-4 whitespace-nowrap font-semibold">
                    ${type.name}
                </td>

                <td class="p-4">
                    ${type.description || '—'}
                </td>

                <td class="p-4 whitespace-nowrap">
                    ${
                        type.isActive
                            ? '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">Activo</span>'
                            : '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">Inactivo</span>'
                    }
                </td>

<td class="p-4 whitespace-nowrap">
    <div class="flex items-center gap-2">

        <button
            onclick="openEditTicketTypeModal(
                ${type.id},
                '${type.name.replace(/'/g, "\\'")}',
                '${(type.description || '').replace(/'/g, "\\'")}'
            )"
            title="Editar"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition">
            ✏️
        </button>

        <button
            onclick="toggleTicketTypeStatus(${type.id}, ${type.isActive})"
            title="${type.isActive ? 'Desactivar' : 'Activar'}"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition">
            ${type.isActive ? '⏸️' : '▶️'}
        </button>

        <button
            onclick="openDeleteTicketTypeModal(${type.id}, '${type.name.replace(/'/g, "\\'")}')"
            title="Eliminar"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition">
            🗑️
        </button>

    </div>
</td>
            </tr>
        `;
    });
};
ticketTypeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
        name: document.getElementById('name').value.trim(),
        description: document.getElementById('description').value.trim()
    };

    const response = await fetch(`${API_URL}/ticket-types`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        openErrorTicketTypeModal(
    result.message || 'No se pudo crear el tipo de ticket'
);
        return;
    }

ticketTypeForm.reset();
loadTicketTypes();
openSuccessTicketTypeModal(
    'Tipo de ticket creado',
    `El tipo de ticket "${payload.name}" fue creado correctamente.`
);
});

const toggleTicketTypeStatus = async (id, currentStatus) => {
    const response = await fetch(`${API_URL}/ticket-types/${id}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            isActive: !currentStatus
        })
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        openErrorTicketTypeModal(
    result.message || 'No se pudo actualizar el estado'
);
        return;
    }

    loadTicketTypes();
openSuccessTicketTypeModal(
    currentStatus ? 'Tipo desactivado' : 'Tipo activado',
    currentStatus
        ? 'El tipo de ticket fue desactivado correctamente.'
        : 'El tipo de ticket fue activado correctamente.'
);
};

const confirmDeleteTicketType = async () => {
    const id = document.getElementById('deleteTicketTypeId').value;

    const response = await fetch(`${API_URL}/ticket-types/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        openErrorTicketTypeModal(
    result.message || 'No se pudo elimiar el tipo de ticket'
);
        return;
    }

    closeDeleteTicketTypeModal();
    loadTicketTypes();
};

const openEditTicketTypeModal = (id, name, description) => {

    document.getElementById('editTicketTypeId').value = id;
    document.getElementById('editTicketTypeName').value = name;
    document.getElementById('editTicketTypeDescription').value = description;

    document
        .getElementById('editTicketTypeModal')
        .classList.remove('hidden');
};

const closeEditTicketTypeModal = () => {

    document
        .getElementById('editTicketTypeModal')
        .classList.add('hidden');
};

const saveTicketTypeChanges = async () => {

    const id =
        document.getElementById('editTicketTypeId').value;

    const payload = {
        name:
            document.getElementById('editTicketTypeName').value.trim(),

        description:
            document.getElementById('editTicketTypeDescription').value.trim()
    };

    const response = await fetch(
        `${API_URL}/ticket-types/${id}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
        openErrorTicketTypeModal(
    result.message || 'No se pudo actualizar el tipo de ticket'
);
        return;
    }

    closeEditTicketTypeModal();
    loadTicketTypes();
    openSuccessTicketTypeModal(
    'Tipo actualizado',
    'Los cambios fueron guardados correctamente.'
);
};
const openSuccessTicketTypeModal = (title, message) => {

    document.getElementById('successTicketTypeTitle').textContent = title;
    document.getElementById('successTicketTypeText').textContent = message;

    const modal = document.getElementById('successTicketTypeModal');
    const content = document.getElementById('successTicketTypeModalContent');

    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);

};

const closeSuccessTicketTypeModal = () => {
    const modal = document.getElementById('successTicketTypeModal');
    const content = document.getElementById('successTicketTypeModalContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

const openDeleteTicketTypeModal = (id, name) => {
    document.getElementById('deleteTicketTypeId').value = id;
    document.getElementById('deleteTicketTypeText').textContent =
        `¿Seguro que deseas eliminar el tipo de ticket "${name}"?`;

    const modal = document.getElementById('deleteTicketTypeModal');
    const content = document.getElementById('deleteTicketTypeModalContent');

    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
};

const closeDeleteTicketTypeModal = () => {
    const modal = document.getElementById('deleteTicketTypeModal');
    const content = document.getElementById('deleteTicketTypeModalContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

const openErrorTicketTypeModal = (message) => {

    document.getElementById('errorTicketTypeText').textContent = message;

    const modal = document.getElementById('errorTicketTypeModal');
    const content = document.getElementById('errorTicketTypeModalContent');

    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);

};

const closeErrorTicketTypeModal = () => {

    const modal = document.getElementById('errorTicketTypeModal');
    const content = document.getElementById('errorTicketTypeModalContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);

};

loadTicketTypes();