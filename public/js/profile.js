const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

let user = JSON.parse(localStorage.getItem('user'));
let selectedPhoto = null;

const getInitials = (name) => {
    return name
        ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : 'US';
};

const loadProfile = () => {
    const avatar =
        document.getElementById('profileAvatar');

    const image =
        document.getElementById('profileImage');

    if (user.profileImage) {

        image.src = user.profileImage;

        image.classList.remove('hidden');
        avatar.classList.add('hidden');

    } else {

        avatar.textContent =
            getInitials(user.name);

        avatar.classList.remove('hidden');
        image.classList.add('hidden');
    }
    document.getElementById('profileName').textContent = user.name || '';
    document.getElementById('profileJobTitle').textContent = user.jobTitle || user.role;
    document.getElementById('profileDepartment').textContent = user.department || 'Sin departamento';

    document.getElementById('name').value = user.name || '';
    document.getElementById('department').value = user.department || '';
    document.getElementById('jobTitle').value = user.jobTitle || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
};

document.getElementById('profileForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
            name: document.getElementById('name').value,
            department: user.department,
            jobTitle: user.jobTitle,
            email: user.email,
            phone: document.getElementById('phone').value,
            role: user.role,
            isActive: true
        })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || 'No se pudo actualizar el perfil');
        return;
    }

    user = {
        ...user,
        name: data.user.name,
        phone: data.user.phone
    };

    localStorage.setItem('user', JSON.stringify(user));

    loadProfile();
    renderLayout('profile');

    alert('Perfil actualizado correctamente');
});
document
    .getElementById('profilePhotoInput')
    .addEventListener('change', (event) => {

        const file = event.target.files[0];

        if (!file) return;

        selectedPhoto = file;

        const image =
            document.getElementById('profileImage');

        const avatar =
            document.getElementById('profileAvatar');

        image.src = URL.createObjectURL(file);

        image.classList.remove('hidden');
        avatar.classList.add('hidden');

        document
            .getElementById('savePhotoBtn')
            .classList.remove('hidden');

        document
            .getElementById('photoUploadMessage')
            .textContent =
                'Vista previa cargada. Presiona "Guardar foto".';
    });
document
    .getElementById('savePhotoBtn')
    .addEventListener('click', async () => {

        if (!selectedPhoto) return;

        const button =
            document.getElementById('savePhotoBtn');

        const message =
            document.getElementById('photoUploadMessage');

        button.disabled = true;
        button.textContent = 'Subiendo...';

        const formData = new FormData();

        formData.append(
            'photo',
            selectedPhoto
        );

        const response = await fetch(
            `${API_URL}/profile/photo`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {

            message.textContent =
                data.message ||
                'No se pudo actualizar la foto';

            button.disabled = false;
            button.textContent = 'Guardar foto';

            return;
        }

        user = data.user;

        localStorage.setItem(
            'user',
            JSON.stringify(user)
        );

        renderLayout('profile');

        message.textContent =
            'Foto actualizada correctamente';

        button.classList.add('hidden');

        selectedPhoto = null;
    });

document.getElementById('passwordForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const message = document.getElementById('passwordMessage');

    message.classList.remove('hidden');
    message.className = 'rounded-xl p-4 text-sm';

    if (!currentPassword || !newPassword || !confirmPassword) {
        message.textContent = 'Completa todos los campos de contraseña.';
        message.classList.add('bg-red-100', 'text-red-700');
        return;
    }

    if (newPassword.length < 6) {
        message.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
        message.classList.add('bg-red-100', 'text-red-700');
        return;
    }

    if (newPassword !== confirmPassword) {
        message.textContent = 'La nueva contraseña y la confirmación no coinciden.';
        message.classList.add('bg-red-100', 'text-red-700');
        return;
    }

    const response = await fetch(`${API_URL}/profile/change-password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
            currentPassword,
            newPassword
        })
    });

    const data = await response.json();

    if (!response.ok) {
        message.textContent = data.message || 'No se pudo actualizar la contraseña.';
        message.classList.add('bg-red-100', 'text-red-700');
        return;
    }

    message.textContent = 'Contraseña actualizada correctamente.';
    message.classList.add('bg-green-100', 'text-green-700');

    document.getElementById('passwordForm').reset();
});
loadProfile();