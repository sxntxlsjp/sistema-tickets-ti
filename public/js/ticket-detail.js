const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token) {
    window.location.href = 'index.html';
}

const params = new URLSearchParams(window.location.search);
const ticketId = params.get('id');
let selectedRating = null;
let selectedFiles = [];
const statusLabels = {
    EN_REVISION: 'En revisión',
    PENDIENTE: 'Pendiente',
    FINALIZADO: 'Finalizado'
};

const loadTicketDetail = async () => {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const ticket = await response.json();
    if (user.role === 'USER') {

    const statusCard =
        document.getElementById('statusCard');

    if (statusCard) {
        statusCard.style.display = 'none';
    }
    }

document.getElementById('ticketHeader').innerHTML = `
    <div class="flex justify-between items-start gap-6">
        <div>
            <h2 class="text-3xl font-bold text-slate-800">
                ${ticket.ticketNumber} - ${ticket.subject}
            </h2>

            <p class="text-slate-500 mt-2">
                Solicitado por ${ticket.requester.name} · ${ticket.type.name}
            </p>

            <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                    <p class="text-slate-400 font-semibold">Tipo</p>
                    <p class="text-slate-700 font-semibold">
                        ${ticket.type?.name || '—'}
                    </p>
                </div>

                <div>
                    <p class="text-slate-400 font-semibold">Prioridad</p>
                    <p class="text-slate-700 font-semibold">
                        ${ticket.priority || '—'}
                    </p>
                </div>

                <div>
                    <p class="text-slate-400 font-semibold">País de soporte</p>
                    <span class="inline-flex items-center">
                        <img
                            src="https://flagcdn.com/24x18/${ticket.country.code.toLowerCase()}.png"
                            alt="${ticket.country.name}"
                            class="w-6 h-4 rounded-sm mr-2 object-cover"
                        >
                        ${ticket.country.name}
                    </span>
                </div>
            </div>
        </div>

        <div class="flex flex-col items-end gap-3">
        <img
            src="https://flagcdn.com/64x48/${ticket.country.code.toLowerCase()}.png"
            alt="${ticket.country.name}"
            class="w-16 h-12 rounded-lg object-cover shadow-sm"
        />

            <span class="px-4 py-2 rounded-full bg-slate-100 font-semibold">
                ${statusLabels[ticket.status]}
            </span>
        </div>
    </div>
`;

    document.getElementById('ticketDescription').textContent =
        ticket.description;

    document.getElementById('statusSelect').value =
        ticket.status;

    renderComments(ticket.comments);
    renderAttachments(ticket.attachments);
    renderHistory(ticket.histories);
    renderAssignSection(ticket);
    renderSatisfaction(ticket);
};

const getInitials = (name) => {
    return name
        ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : 'US';
};

const renderComments = (comments) => {
    const container = document.getElementById('commentsList');
    container.innerHTML = '';

    if (!comments || comments.length === 0) {
        container.innerHTML = `
            <p class="text-slate-500">
                Aún no existen comentarios en este ticket.
            </p>
        `;
        return;
    }

    comments.forEach(item => {
        const user = item.user;

        const avatar = user.profileImage
            ? `
                <img
                    src="${user.profileImage}"
                    class="w-11 h-11 rounded-full object-cover border"
                >
            `
            : `
                <div class="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                    ${getInitials(user.name)}
                </div>
            `;

        container.innerHTML += `
            <div class="border rounded-2xl p-4 bg-white">

                <div class="flex gap-3">

                    <div class="shrink-0">
                        ${avatar}
                    </div>

                    <div class="flex-1">

                        <div class="flex justify-between gap-3">

                            <div>
                                <p class="font-semibold text-slate-800">
                                    ${user.name}
                                </p>

                                <p class="text-xs text-slate-500">
                                    ${user.jobTitle || user.role} ${user.department ? '· ' + user.department : ''}
                                </p>
                            </div>

                            <p class="text-xs text-slate-400 whitespace-nowrap">
                                ${new Date(item.createdAt).toLocaleString('es-EC')}
                            </p>

                        </div>

                        <p class="text-slate-700 mt-3 leading-relaxed">
                            ${item.comment}
                        </p>

                    </div>

                </div>

            </div>
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
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return '🗜️';

    return '📎';
};

const renderAttachments = (attachments) => {
    const container = document.getElementById('attachmentsList');
    container.innerHTML = '';

    if (!attachments || attachments.length === 0) {
        container.innerHTML = `
            <div class="border border-dashed rounded-2xl p-5 text-center text-slate-500">
                No hay archivos adjuntos.
            </div>
        `;
        return;
    }

    attachments.forEach(file => {
        const fileUrl = `/uploads/${file.filePath}`;
        const isImage = file.mimeType?.includes('image');

        container.innerHTML += `
            <div class="border rounded-2xl p-4 hover:bg-slate-50 transition">

                ${
                    isImage
                        ? `
                            <a href="${fileUrl}" target="_blank">
                                <img
                                    src="${fileUrl}"
                                    class="w-full h-32 object-cover rounded-xl mb-3 border"
                                >
                            </a>
                        `
                        : ''
                }

                <div class="flex items-start gap-3">

                    <div class="text-3xl">
                        ${getFileIcon(file.mimeType)}
                    </div>

                    <div class="flex-1 min-w-0">

                        <p class="font-semibold text-slate-800 truncate">
                            ${file.fileName}
                        </p>

                        <p class="text-xs text-slate-500 mt-1">
                            ${formatFileSize(file.fileSize)} · ${new Date(file.uploadedAt).toLocaleString('es-EC')}
                        </p>
                            ${
                                file.uploader
                                    ? `
                                        <div class="flex items-center gap-2 mt-3">

                                            ${
                                                file.uploader.profileImage
                                                    ? `
                                                        <img
                                                            src="${file.uploader.profileImage}"
                                                            class="w-8 h-8 rounded-full object-cover border"
                                                        >
                                                    `
                                                    : `
                                                        <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                                                            ${getInitials(file.uploader.name)}
                                                        </div>
                                                    `
                                            }

                                            <div>
                                                <p class="text-xs font-semibold text-slate-700">
                                                    ${file.uploader.name}
                                                </p>

                                                <p class="text-xs text-slate-500">
                                                    ${file.uploader.jobTitle || file.uploader.role}
                                                    ${file.uploader.department ? '· ' + file.uploader.department : ''}
                                                </p>
                                            </div>

                                        </div>
                                    `
                                    : `
                                        <p class="text-xs text-slate-400 mt-3">
                                            Subido por usuario no registrado
                                        </p>
                                    `
                            }

                        <a href="${fileUrl}"
                           target="_blank"
                           class="inline-block mt-3 text-sm font-semibold text-slate-900 hover:underline">
                            Ver / Descargar
                        </a>

                    </div>

                </div>

            </div>
        `;
    });
};

const renderHistory = (histories) => {
    const container = document.getElementById('historyList');
    container.innerHTML = '';

    if (!histories || histories.length === 0) {
        container.innerHTML = `
            <p class="text-slate-500">
                Sin movimientos registrados.
            </p>
        `;
        return;
    }

    histories.forEach(item => {
        const changer = item.changer;

        const initials = changer?.name
            ? changer.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
            : 'US';

        const avatar = changer?.profileImage
            ? `
                <img
                    src="${changer.profileImage}"
                    class="w-10 h-10 rounded-full object-cover border"
                >
            `
            : `
                <div class="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                    ${initials}
                </div>
            `;

        const isStatusChange =
            item.oldStatus !== item.newStatus;

        const isAssignmentChange =
            item.oldAssignedTo !== item.newAssignedTo;

        let actionText = 'Actualizó el ticket';

        if (isStatusChange && isAssignmentChange) {
            actionText = 'Actualizó estado y responsable';
        } else if (isStatusChange) {
            actionText = 'Cambió el estado';
        } else if (isAssignmentChange) {
            actionText = 'Reasignó el ticket';
        }

        container.innerHTML += `
            <div class="relative pl-8 pb-6 border-l-2 border-slate-200">

                <div class="absolute -left-[21px] top-0">
                    ${avatar}
                </div>

                <div class="bg-slate-50 rounded-2xl p-4 ml-4">

                    <div class="flex justify-between gap-3 mb-2">

                        <div>
                            <p class="font-semibold text-slate-800">
                                ${changer?.name || 'Usuario'}
                            </p>

                            <p class="text-xs text-slate-500">
                                ${changer?.jobTitle || changer?.role || ''}
                                ${changer?.department ? '· ' + changer.department : ''}
                            </p>
                        </div>

                        <p class="text-xs text-slate-400 whitespace-nowrap">
                            ${new Date(item.createdAt).toLocaleString('es-EC')}
                        </p>

                    </div>

                    <p class="text-sm font-semibold text-slate-700 mb-3">
                        ${actionText}
                    </p>

                    ${
                        isStatusChange
                            ? `
                                <div class="text-sm bg-white rounded-xl p-3 mb-2 border">
                                    <span class="text-slate-500">Estado:</span>
                                    <span class="font-semibold">${statusLabels[item.oldStatus] || item.oldStatus}</span>
                                    →
                                    <span class="font-semibold">${statusLabels[item.newStatus] || item.newStatus}</span>
                                </div>
                            `
                            : ''
                    }

                    ${
                        isAssignmentChange
                            ? `
                                <div class="text-sm bg-white rounded-xl p-3 border">
                                    <span class="text-slate-500">Responsable:</span>
                                    <span class="font-semibold">
                                        ${item.oldAssignee?.name || 'Sin responsable'}
                                    </span>
                                    →
                                    <span class="font-semibold">
                                        ${item.newAssignee?.name || 'Sin responsable'}
                                    </span>
                                </div>
                            `
                            : ''
                    }

                </div>

            </div>
        `;
    });
};
const renderSatisfaction = (ticket) => {
    const card = document.getElementById('satisfactionCard');

    if (!card) return;

    if (
        user.role === 'USER' &&
        ticket.status === 'FINALIZADO' &&
        !ticket.satisfaction
    ) {
        card.classList.remove('hidden');
    } else {
        card.classList.add('hidden');
    }
};
const renderAssignSection = async (ticket) => {
    const assignCard = document.getElementById('assignCard');

    if (!assignCard) return;

    if (user.role !== 'ADMIN') {
        assignCard.style.display = 'none';
        return;
    }

    document.getElementById('currentAssignee').textContent =
        `Responsable actual: ${ticket.assignee?.name || 'Sin responsable'}`;

    const response = await fetch(`${API_URL}/users/support`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const admins = await response.json();

    const select = document.getElementById('assignSelect');
    select.innerHTML = '';

    admins.forEach(admin => {
        select.innerHTML += `
            <option value="${admin.id}" ${admin.id === ticket.assignedTo ? 'selected' : ''}>
                ${admin.name}
            </option>
        `;
    });
};

const reassignTicket = async () => {
    const assignedTo = document.getElementById('assignSelect').value;

    const response = await fetch(`${API_URL}/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
            assignedTo: Number(assignedTo)
        })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || 'No se pudo reasignar el ticket');
        return;
    }

    alert('Ticket reasignado correctamente');
    loadTicketDetail();
};
const updateStatus = async () => {
    const status = document.getElementById('statusSelect').value;

    await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status })
    });

    loadTicketDetail();
};

document.getElementById('commentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const comment = document.getElementById('commentText').value;

    await fetch(`${API_URL}/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ comment })
    });

    document.getElementById('commentText').value = '';
    loadTicketDetail();
});
document.querySelectorAll('.rating-btn').forEach(button => {
    button.addEventListener('click', () => {
        selectedRating = Number(button.dataset.rating);

        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.remove('scale-125', 'opacity-100');
            btn.classList.add('opacity-60');
        });

        button.classList.remove('opacity-60');
        button.classList.add('scale-125', 'opacity-100');
    });
});

document.getElementById('sendSatisfactionBtn').addEventListener('click', async () => {
    const message = document.getElementById('satisfactionMessage');

    if (!selectedRating) {
        message.textContent = 'Selecciona una calificación antes de enviar.';
        message.className = 'mt-4 text-sm text-yellow-300';
        return;
    }

    const comment = document.getElementById('satisfactionComment').value;

    const response = await fetch(`${API_URL}/tickets/${ticketId}/satisfaction`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            rating: selectedRating,
            comment
        })
    });

    const data = await response.json();

    if (!response.ok) {
        message.textContent = data.message || 'No se pudo enviar la evaluación.';
        message.className = 'mt-4 text-sm text-red-300';
        return;
    }

    message.textContent = '¡Gracias por tu evaluación!';
    message.className = 'mt-4 text-sm text-green-300';

    setTimeout(() => {
        loadTicketDetail();
    }, 1000);
});

const renderSelectedFiles = () => {
    const list = document.getElementById('selectedFilesList');
    const button = document.getElementById('uploadFilesBtn');

    list.innerHTML = '';

    if (selectedFiles.length === 0) {
        button.classList.add('hidden');
        return;
    }

    selectedFiles.forEach((file, index) => {
        const isImage = file.type.includes('image');
        const previewUrl = isImage ? URL.createObjectURL(file) : null;

        list.innerHTML += `
            <div class="flex items-center justify-between bg-slate-50 border rounded-xl p-3 gap-3">

                <div class="flex items-center gap-3 min-w-0">

                    ${
                        isImage
                            ? `
                                <img
                                    src="${previewUrl}"
                                    class="w-14 h-14 rounded-xl object-cover border shrink-0"
                                >
                            `
                            : `
                                <div class="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-2xl shrink-0">
                                    ${getFileIcon(file.type)}
                                </div>
                            `
                    }

                    <div class="min-w-0">
                        <p class="font-semibold text-sm text-slate-700 truncate">
                            ${file.name}
                        </p>

                        <p class="text-xs text-slate-500">
                            ${formatFileSize(file.size)}
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    onclick="removeSelectedFile(${index})"
                    class="text-red-600 text-sm font-semibold shrink-0">
                    Quitar
                </button>

            </div>
        `;
    });

    button.classList.remove('hidden');
};

const removeSelectedFile = (index) => {
    selectedFiles.splice(index, 1);
    renderSelectedFiles();
};

const addFiles = (files) => {
    selectedFiles = [
        ...selectedFiles,
        ...Array.from(files)
    ];

    renderSelectedFiles();
};

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (event) => {
    addFiles(event.target.files);
    fileInput.value = '';
});

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('bg-slate-100', 'border-slate-500');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('bg-slate-100', 'border-slate-500');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();

    dropZone.classList.remove('bg-slate-100', 'border-slate-500');

    addFiles(event.dataTransfer.files);
});

document.getElementById('attachmentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const message = document.getElementById('attachmentMessage');

    message.textContent = '';

    if (selectedFiles.length === 0) {

        message.textContent =
            'Selecciona al menos un archivo';

        message.className =
            'mt-3 text-sm text-red-600';

        return;
    }

    const uploadButton =
        document.getElementById('uploadFilesBtn');

    uploadButton.disabled = true;
    uploadButton.textContent = 'Subiendo archivos...';

    try {

        for (const file of selectedFiles) {

            const formData = new FormData();

            formData.append('file', file);

            const response = await fetch(
                `${API_URL}/tickets/${ticketId}/attachments`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error al subir ${file.name}`
                );
            }
        }

        message.textContent =
            `${selectedFiles.length} archivo(s) subidos correctamente`;

        message.className =
            'mt-3 text-sm text-green-600';

        selectedFiles = [];

        renderSelectedFiles();

        loadTicketDetail();

    } catch (error) {

        console.error(error);

        message.textContent =
            'Ocurrió un error al subir los archivos';

        message.className =
            'mt-3 text-sm text-red-600';
    }

    uploadButton.disabled = false;
    uploadButton.textContent = 'Subir archivos';
});



loadTicketDetail();