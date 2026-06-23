const token = localStorage.getItem('token');
let createSelectedFiles = [];
let createdTicketRedirect = 'user-home.html';
let createdTicketId = null;
const user = JSON.parse(localStorage.getItem('user'));

if (!token) {
    window.location.href = 'index.html';
}

const typeSelect = document.getElementById('typeId');
const assignedSelect = document.getElementById('assignedTo');
const countrySelect = document.getElementById('countryId');
const form = document.getElementById('ticketForm');
const message = document.getElementById('message');

const loadTicketTypes = async () => {

    const response = await fetch(
        `${API_URL}/ticket-types`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    const types = await response.json();

    typeSelect.innerHTML = '';

    types.forEach(type => {
        typeSelect.innerHTML += `
            <option value="${type.id}">
                ${type.name}
            </option>
        `;
    });
};

const loadSupportUsers = async () => {

    const response = await fetch(
        `${API_URL}/users/support`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    const users = await response.json();

        assignedSelect.innerHTML =
            '<option value="">Seleccione un responsable</option>';

    users.forEach(user => {

        assignedSelect.innerHTML += `
            <option value="${user.id}">
                ${user.name}
            </option>
        `;
    });
};
const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';

    const kb = bytes / 1024;

    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
};

const getFileIcon = (mimeType) => {
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('excel')) return '📊';

    return '📎';
};

const renderCreateFiles = () => {

    const list =
        document.getElementById('createSelectedFilesList');

    list.innerHTML = '';

    createSelectedFiles.forEach((file, index) => {

        const isImage =
            file.type.includes('image');

        const preview =
            isImage
                ? URL.createObjectURL(file)
                : null;

        list.innerHTML += `
            <div class="flex items-center justify-between border rounded-xl p-3 bg-slate-50">

                <div class="flex items-center gap-3">

                    ${
                        isImage
                            ? `
                                <img
                                    src="${preview}"
                                    class="w-12 h-12 rounded-lg object-cover border"
                                >
                            `
                            : `
                                <div class="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                                    ${getFileIcon(file.type)}
                                </div>
                            `
                    }

                    <div>
                        <p class="font-semibold text-sm">
                            ${file.name}
                        </p>

                        <p class="text-xs text-slate-500">
                            ${formatFileSize(file.size)}
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    onclick="removeCreateFile(${index})"
                    class="text-red-600 text-sm font-semibold">
                    Quitar
                </button>

            </div>
        `;
    });
};

const removeCreateFile = (index) => {
    createSelectedFiles.splice(index, 1);
    renderCreateFiles();
};

window.removeCreateFile = removeCreateFile;

const addCreateFiles = (files) => {
    createSelectedFiles = [
        ...createSelectedFiles,
        ...Array.from(files)
    ];

    renderCreateFiles();
};
const createDropZone =
    document.getElementById('createDropZone');

const createFileInput =
    document.getElementById('createFileInput');

createDropZone.addEventListener('click', () => {
    createFileInput.click();
});

createFileInput.addEventListener('change', (event) => {
    addCreateFiles(event.target.files);
    createFileInput.value = '';
});

createDropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    createDropZone.classList.add(
        'bg-slate-100',
        'border-slate-500'
    );
});

createDropZone.addEventListener('dragleave', () => {
    createDropZone.classList.remove(
        'bg-slate-100',
        'border-slate-500'
    );
});

createDropZone.addEventListener('drop', (event) => {
    event.preventDefault();

    createDropZone.classList.remove(
        'bg-slate-100',
        'border-slate-500'
    );

    addCreateFiles(event.dataTransfer.files);
});

const getInitials = (name) => {
    return name
        ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : 'US';
};

const showSuccessTicketModal = (ticket) => {
    createdTicketId = ticket.id;
    const modal = document.getElementById('successTicketModal');

    const assignee = ticket.assignee;

    document.getElementById('createdTicketNumber').textContent =
        `${ticket.ticketNumber} fue asignado correctamente.`;

    const avatar = document.getElementById('assignedAdminAvatar');

    if (assignee?.profileImage) {
        avatar.innerHTML = `
            <img
                src="${assignee.profileImage}"
                class="w-14 h-14 rounded-full object-cover"
            >
        `;
    } else {
        avatar.textContent = getInitials(assignee?.name);
    }

    document.getElementById('assignedAdminName').textContent =
        assignee?.name || 'Sin responsable';

    document.getElementById('assignedAdminJob').textContent =
        assignee?.jobTitle || assignee?.role || '';

    const user = JSON.parse(localStorage.getItem('user'));

    createdTicketRedirect =
        user.role === 'ADMIN'
            ? 'dashboard.html'
            : 'user-home.html';

    modal.classList.remove('hidden');
};

const goAfterTicketCreated = () => {
    document.getElementById('ticketForm').reset();

    createSelectedFiles = [];
    renderCreateFiles();

    window.location.href = createdTicketRedirect;
};

const goToCreatedTicket = () => {

    if (!createdTicketId) {
        return;
    }

    window.location.href =
        `ticket-detail.html?id=${createdTicketId}`;
};

window.goToCreatedTicket =
    goToCreatedTicket;

form.addEventListener('submit', async (event) => {

    event.preventDefault();

const countryId = Number(document.getElementById('countryId').value);

if (!countryId) {
    alert('Seleccione el país desde donde requiere el soporte');
    return;
}

const payload = {
    typeId: Number(typeSelect.value),
    subject: document.getElementById('subject').value,
    assignedTo: assignedSelect.value || null,
    priority: document.getElementById('priority').value,
    description: document.getElementById('description').value,
    countryId: countryId
};
console.log('Payload Ticket:', payload);
    const response = await fetch(
        `${API_URL}/tickets`,
        {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        }
    );

    const data = await response.json();

    if (!response.ok) {

        message.className =
            'text-red-600 font-semibold';

        message.textContent =
            data.message || 'Error al crear ticket';

        return;
    }
if (createSelectedFiles.length > 0) {

    const message =
        document.getElementById('createAttachmentMessage');

    message.textContent =
        'Subiendo evidencias...';

    message.className =
        'mt-3 text-sm text-slate-600';

    for (const file of createSelectedFiles) {

        const formData = new FormData();

        formData.append('file', file);

        const uploadResponse = await fetch(
            `${API_URL}/tickets/${data.ticket.id}/attachments`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            }
        );

        if (!uploadResponse.ok) {
            message.textContent =
                'El ticket fue creado, pero ocurrió un error al subir una evidencia.';

            message.className =
                'mt-3 text-sm text-red-600';

            return;
        }
    }

    message.textContent =
        'Evidencias subidas correctamente.';

    message.className =
        'mt-3 text-sm text-green-600';
}
showSuccessTicketModal(data.ticket);

});



const renderMenu = () => {
    const menu = document.getElementById('sidebarMenu');

    if (!menu) return;

    if (user.role === 'ADMIN') {
        menu.innerHTML = `
            <a href="dashboard.html" class="block hover:bg-slate-800 px-4 py-3 rounded-xl">
                Dashboard
            </a>

            <a href="tickets.html" class="block hover:bg-slate-800 px-4 py-3 rounded-xl">
                Tickets
            </a>

            <a href="create-ticket.html" class="block bg-slate-800 px-4 py-3 rounded-xl">
                Nuevo Ticket
            </a>
            <a href="users.html" class="block hover:bg-slate-800 px-4 py-3 rounded-xl">
                Usuarios
            </a>
            <button onclick="logout()" class="w-full text-left hover:bg-red-600 px-4 py-3 rounded-xl">
                Cerrar sesión
            </button>
        `;
    } else {
        menu.innerHTML = `
            <a href="tickets.html" class="block hover:bg-slate-800 px-4 py-3 rounded-xl">
                Mis Tickets
            </a>

            <a href="create-ticket.html" class="block bg-slate-800 px-4 py-3 rounded-xl">
                Crear Ticket
            </a>

            <button onclick="logout()" class="w-full text-left hover:bg-red-600 px-4 py-3 rounded-xl">
                Cerrar sesión
            </button>
        `;
    }
};

const loadCountries = async () => {
    try {
        const response = await fetch(
            `${API_URL}/countries/active`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        const countries = result.data;

        countrySelect.innerHTML =
            '<option value="">Seleccione un país</option>';

        countries.forEach(country => {
            countrySelect.innerHTML += `
                <option value="${country.id}">
                    ${country.flagEmoji} ${country.name}
                </option>
            `;
        });

    } catch (error) {
        console.error('Error cargando países:', error);
    }
};

renderMenu();
loadTicketTypes();
loadSupportUsers();
loadCountries();

