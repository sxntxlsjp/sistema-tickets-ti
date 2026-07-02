const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
    window.location.href = 'index.html';
}

if (user.role !== 'ADMIN') {
    window.location.href = 'tickets.html';
}

const showPrioritySwitch = document.getElementById('showPriorityField');

const loadShowPrioritySetting = async () => {
    const response = await fetch(`${API_URL}/system-settings/showPriorityField`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json();

    const setting = result.data || result;

    showPrioritySwitch.checked = setting.value === 'true';
};

showPrioritySwitch.addEventListener('change', async () => {
    const newValue = showPrioritySwitch.checked ? 'true' : 'false';

    const response = await fetch(`${API_URL}/system-settings/showPriorityField/value`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            value: newValue
        })
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        alert(result.message || 'No se pudo actualizar la configuración');
        showPrioritySwitch.checked = !showPrioritySwitch.checked;
    }
});

loadShowPrioritySetting();