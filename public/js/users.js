const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

const user = JSON.parse(localStorage.getItem('user'));

if (!user || user.role !== 'ADMIN') {
    window.location.href = 'user-home.html';
}

const usersList = document.getElementById('usersList');
let usersCache = [];
const userForm = document.getElementById('userForm');

const loadUsers = async () => {
    const response = await fetch(`${API_URL}/users`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const users = await response.json();
    usersCache = users;

    usersList.innerHTML = '';

users.forEach(item => {

    const initials = item.name
        ? item.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
        : 'US';

    const avatar = item.profileImage
        ? `
            <img
                src="${item.profileImage}"
                class="w-11 h-11 rounded-full object-cover border"
            >
        `
        : `
            <div class="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                ${initials}
            </div>
        `;

    usersList.innerHTML += `
        <tr class="hover:bg-slate-50">

            <td class="p-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                    ${avatar}

                    <div>
                        <p class="font-semibold text-slate-800">
                            ${item.name}
                        </p>

                        <p class="text-xs text-slate-500">
                            ID ${item.id}
                        </p>
                    </div>
                </div>
            </td>

            <td class="p-4 whitespace-nowrap">
                ${item.department || '-'}
            </td>

            <td class="p-4 whitespace-nowrap">
                ${item.jobTitle || '-'}
            </td>

            <td class="p-4 whitespace-nowrap">
                ${item.email}
            </td>

            <td class="p-4 whitespace-nowrap">
                ${item.phone || '-'}
            </td>

            <td class="p-4 whitespace-nowrap">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                    item.role === 'ADMIN'
                        ? 'bg-slate-900 text-white'
                        : 'bg-blue-100 text-blue-700'
                }">
                    ${item.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                </span>
            </td>

            <td class="p-4 whitespace-nowrap">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                    item.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                }">
                    ${item.isActive ? 'Activo' : 'Inactivo'}
                </span>
            </td>

            <td class="p-4 whitespace-nowrap">
                <div class="flex gap-2">

                    <button
                        onclick="editUser(${item.id})"
                        title="Editar usuario"
                        class="w-9 h-9 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                        ✏️
                    </button>

                    <button
                        onclick="resetPassword(${item.id})"
                        title="Resetear contraseña"
                        class="w-9 h-9 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200">
                        🔑
                    </button>

                    <button
                        onclick="toggleUser(${item.id})"
                        title="${item.isActive ? 'Desactivar usuario' : 'Activar usuario'}"
                        class="w-9 h-9 ${
                            item.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } rounded-lg">
                        ${item.isActive ? '🚫' : '✅'}
                    </button>

                </div>
            </td>

        </tr>
    `;
});
};

userForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
        name: document.getElementById('name').value,
        department: document.getElementById('department').value,
        jobTitle: document.getElementById('jobTitle').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || 'Error al crear usuario');
        return;
    }

    userForm.reset();
    loadUsers();
});


const editUser = (userId) => {

    const user = usersCache.find(
        u => u.id === userId
    );

    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editDepartment').value = user.department || '';
    document.getElementById('editJobTitle').value = user.jobTitle || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editPhone').value = user.phone || '';
    document.getElementById('editRole').value = user.role;

    document
        .getElementById('editModal')
        .classList.remove('hidden');
};

const closeEditModal = () => {

    document
        .getElementById('editModal')
        .classList.add('hidden');
};
const saveUserChanges = async () => {

    const userId =
        document.getElementById('editUserId').value;

    const response = await fetch(
        `${API_URL}/users/${userId}`,
        {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({
                name: document.getElementById('editName').value,
                department: document.getElementById('editDepartment').value,
                jobTitle: document.getElementById('editJobTitle').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                role: document.getElementById('editRole').value,
                isActive: true
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || 'Error al actualizar usuario');
        return;
    }

    closeEditModal();
    loadUsers();

    alert('Usuario actualizado correctamente');
};
const resetPassword = (userId) => {
    const user = usersCache.find(u => u.id === userId);

    if (!user) return;

    document.getElementById('passwordUserId').value = user.id;
    document.getElementById('passwordModalUser').textContent =
        `Usuario: ${user.name} · ${user.email}`;

    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordMessage').classList.add('hidden');

    document.getElementById('passwordModal').classList.remove('hidden');
};

const closePasswordModal = () => {
    document.getElementById('passwordModal').classList.add('hidden');
};

const saveNewPassword = async () => {
    const userId = document.getElementById('passwordUserId').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const message = document.getElementById('passwordMessage');

    message.classList.add('hidden');
    message.textContent = '';

    if (!newPassword || !confirmPassword) {
        message.textContent = 'Debes ingresar y confirmar la contraseña.';
        message.className = 'text-sm mb-4 text-red-600';
        return;
    }

    if (newPassword.length < 6) {
        message.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        message.className = 'text-sm mb-4 text-red-600';
        return;
    }

    if (newPassword !== confirmPassword) {
        message.textContent = 'Las contraseñas no coinciden.';
        message.className = 'text-sm mb-4 text-red-600';
        return;
    }

    const response = await fetch(`${API_URL}/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
            password: newPassword
        })
    });

    const data = await response.json();

    if (!response.ok) {
        message.textContent = data.message || 'No se pudo actualizar la contraseña.';
        message.className = 'text-sm mb-4 text-red-600';
        return;
    }

    message.textContent = 'Contraseña actualizada correctamente.';
    message.className = 'text-sm mb-4 text-green-600';

    setTimeout(() => {
        closePasswordModal();
    }, 800);
};
const toggleUser = (userId) => {
    const user = usersCache.find(u => u.id === userId);

    if (!user) return;

    document.getElementById('statusUserId').value = user.id;

    document.getElementById('statusModalTitle').textContent =
        user.isActive ? 'Desactivar usuario' : 'Activar usuario';

    document.getElementById('statusModalText').textContent =
        user.isActive
            ? `¿Seguro que deseas desactivar a ${user.name}? El usuario ya no podrá iniciar sesión.`
            : `¿Seguro que deseas activar a ${user.name}? El usuario podrá iniciar sesión nuevamente.`;

    const button = document.getElementById('confirmStatusBtn');

    button.textContent =
        user.isActive ? 'Desactivar' : 'Activar';

    button.className =
        user.isActive
            ? 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl'
            : 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl';

    document.getElementById('statusModal').classList.remove('hidden');
};

const closeStatusModal = () => {
    document.getElementById('statusModal').classList.add('hidden');
};

const confirmToggleUser = async () => {
    const userId = document.getElementById('statusUserId').value;

    const response = await fetch(`${API_URL}/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || 'No se pudo cambiar el estado del usuario');
        return;
    }

    closeStatusModal();
    loadUsers();
};
loadUsers();