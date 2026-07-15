const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
    window.location.href = 'index.html';
}

if (user.role !== 'ADMIN') {
    window.location.href = 'tickets.html';
}

const priorityForm = document.getElementById('priorityForm');
const prioritiesList = document.getElementById('prioritiesList');

const loadPriorities = async () => {

    const response = await fetch(
        `${API_URL}/ticket-priorities`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const result = await response.json();
    const priorities = result.data || result;

    prioritiesList.innerHTML = '';

    priorities.forEach(priority => {

        prioritiesList.innerHTML += `
            <tr class="hover:bg-slate-50">

                <td class="p-4 font-semibold">
                    <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white"
                        style="background:${priority.color}">
                        ${priority.name}
                    </span>
                </td>

                <td class="p-4">
                    ${priority.description || '—'}
                </td>

                <td class="p-4">
                    ${formatSla(priority.slaDurationMinutes)}
                </td>


                <td class="p-4">
                    ${priority.displayOrder || '—'}
                </td>

                <td class="p-4">
                    ${
                        priority.isActive
                            ? '<span class="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">Activo</span>'
                            : '<span class="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">Inactivo</span>'
                    }
                </td>

                <td class="p-4">
                <div class="flex items-center gap-2">

                    <button
                        onclick="openEditPriorityModal(
                            ${priority.id},
                            '${priority.name.replace(/'/g, "\\'")}',
                            '${(priority.description || '').replace(/'/g, "\\'")}',
                            ${priority.slaDurationMinutes},
                            '${priority.color}',
                            ${priority.displayOrder || 1}
                        )"
                        title="Editar"
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition">
                        ✏️
                    </button>

                    <button
                        onclick="togglePriorityStatus(${priority.id}, ${priority.isActive})"
                        title="${priority.isActive ? 'Desactivar' : 'Activar'}"
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition">
                        ${priority.isActive ? '⏸️' : '▶️'}
                    </button>

                <button
                    onclick="openDeletePriorityModal(${priority.id}, '${priority.name.replace(/'/g, "\\'")}')"
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
const convertSlaToMinutes = (value, unit) => {
    const numericValue = Number(value);

    if (unit === 'hours') {
        return numericValue * 60;
    }

    if (unit === 'days') {
        return numericValue * 24 * 60;
    }

    return numericValue;
};

priorityForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const slaMinutes = convertSlaToMinutes(
        document.getElementById('slaValue').value,
        document.getElementById('slaUnit').value
    );

    const payload = {
        name: document.getElementById('name').value.trim(),
        description: document.getElementById('description').value.trim(),
        slaDurationMinutes: slaMinutes,
        color: document.getElementById('color').value,
        displayOrder: Number(document.getElementById('sortOrder').value)
    };

    const response = await fetch(`${API_URL}/ticket-priorities`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        openErrorPriorityModal(
    result.message || 'No se pudo crear la prioridad'
);
        return;
    }

    priorityForm.reset();
    document.getElementById('color').value = '#EF4444';
    document.getElementById('sortOrder').value = 1;

    loadPriorities();
    openSuccessPriorityModal(
        'Prioridad creada',
        'La prioridad fue creada correctamente.'
    );
});

const formatSla = (minutes) => {

    if (minutes % 1440 === 0) {
        const days = minutes / 1440;
        return `${days} ${days === 1 ? 'día' : 'días'}`;
    }

    if (minutes % 60 === 0) {
        const hours = minutes / 60;
        return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    return `${minutes} min`;

};

const togglePriorityStatus = async (id, currentStatus) => {
    const response = await fetch(`${API_URL}/ticket-priorities/${id}/status`, {
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
        openErrorPriorityModal(
    result.message || 'No se pudo actaulizar el estado'
);
        return;
    }

    loadPriorities();
    openSuccessPriorityModal(
        currentStatus ? 'Prioridad desactivada' : 'Prioridad activada',
        currentStatus
            ? 'La prioridad fue desactivada correctamente.'
            : 'La prioridad fue activada correctamente.'
    );
};

const confirmDeletePriority = async () => {
    const id = document.getElementById('deletePriorityId').value;

    const response = await fetch(`${API_URL}/ticket-priorities/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        closeDeletePriorityModal();

        openErrorPriorityModal(
            result.message || 'No se pudo eliminar la prioridad'
        );

        return;
    }

    closeDeletePriorityModal();
    loadPriorities();

    openSuccessPriorityModal(
        'Prioridad eliminada',
        'La prioridad fue eliminada correctamente.'
    );
};

const getSlaValueAndUnit = (minutes) => {
    if (minutes % 1440 === 0) {
        return {
            value: minutes / 1440,
            unit: 'days'
        };
    }

    if (minutes % 60 === 0) {
        return {
            value: minutes / 60,
            unit: 'hours'
        };
    }

    return {
        value: minutes,
        unit: 'minutes'
    };
};

const openEditPriorityModal = (
    id,
    name,
    description,
    slaDurationMinutes,
    color,
    displayOrder
) => {
    const sla = getSlaValueAndUnit(slaDurationMinutes);

    document.getElementById('editPriorityId').value = id;
    document.getElementById('editPriorityName').value = name;
    document.getElementById('editPriorityDescription').value = description;
    document.getElementById('editSlaValue').value = sla.value;
    document.getElementById('editSlaUnit').value = sla.unit;
    document.getElementById('editPriorityColor').value = color;
    document.getElementById('editPriorityOrder').value = displayOrder;

    document.getElementById('editPriorityModal').classList.remove('hidden');
};

const closeEditPriorityModal = () => {
    document.getElementById('editPriorityModal').classList.add('hidden');
};

const savePriorityChanges = async () => {
    const id = document.getElementById('editPriorityId').value;

    const slaMinutes = convertSlaToMinutes(
        document.getElementById('editSlaValue').value,
        document.getElementById('editSlaUnit').value
    );

    const payload = {
        name: document.getElementById('editPriorityName').value.trim(),
        description: document.getElementById('editPriorityDescription').value.trim(),
        slaDurationMinutes: slaMinutes,
        color: document.getElementById('editPriorityColor').value,
        displayOrder: Number(document.getElementById('editPriorityOrder').value)
    };

    const response = await fetch(`${API_URL}/ticket-priorities/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        openErrorPriorityModal(
    result.message || 'No se pudo actaulizar la prioridad'
);
        return;
    }

    closeEditPriorityModal();
    loadPriorities();
    openSuccessPriorityModal(
        'Prioridad actualizada',
        'Los cambios fueron guardados correctamente.'
    );
};
const openSuccessPriorityModal = (title, message) => {
    document.getElementById('successPriorityTitle').textContent = title;
    document.getElementById('successPriorityText').textContent = message;

    const modal = document.getElementById('successPriorityModal');
    const content = document.getElementById('successPriorityModalContent');

    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
};

const closeSuccessPriorityModal = () => {
    const modal = document.getElementById('successPriorityModal');
    const content = document.getElementById('successPriorityModalContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

const openErrorPriorityModal = (message) => {

    document.getElementById('errorPriorityText').textContent = message;

    const modal = document.getElementById('errorPriorityModal');
    const content = document.getElementById('errorPriorityModalContent');

    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);

};

const closeErrorPriorityModal = () => {

    const modal = document.getElementById('errorPriorityModal');
    const content = document.getElementById('errorPriorityModalContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);

};

const openDeletePriorityModal = (id, name) => {
    document.getElementById('deletePriorityId').value = id;
    document.getElementById('deletePriorityText').textContent =
        `¿Seguro que deseas eliminar la prioridad "${name}"?`;

    const modal = document.getElementById('deletePriorityModal');
    const content = document.getElementById('deletePriorityModalContent');

    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
};

const closeDeletePriorityModal = () => {
    const modal = document.getElementById('deletePriorityModal');
    const content = document.getElementById('deletePriorityModalContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

loadPriorities();