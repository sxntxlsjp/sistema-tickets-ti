const token = getToken();

if (!token) {
    window.location.href = 'index.html';
}

const user = JSON.parse(localStorage.getItem('user'));

if (!user || !user.isSuperAdmin) {
    window.location.href = 'dashboard.html';
}

let tenantsCache = [];

const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const accessTenant = (tenantId) => {
    const tenant = tenantsCache.find(t => t.id === tenantId);
    if (!tenant) return;

    applyTenantSelection({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        role: 'SUPER_ADMIN'
    });
};

window.accessTenant = accessTenant;

const loadTenants = async () => {
    const container = document.getElementById('tenantsList');

    const response = await fetch(`${API_URL}/tenants`, {
        headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        container.innerHTML = `<p class="text-red-600">${escapeHtml(data.message || 'No se pudieron cargar las empresas')}</p>`;
        return;
    }

    tenantsCache = data.data;

    container.innerHTML = '';

    if (tenantsCache.length === 0) {
        container.innerHTML = '<p class="text-slate-500">Aún no hay empresas registradas.</p>';
        return;
    }

    tenantsCache.forEach(tenant => {
        container.innerHTML += `
            <div class="border rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">

                <div>
                    <div class="flex items-center gap-3">
                        <h4 class="font-bold text-slate-800">${escapeHtml(tenant.name)}</h4>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                            tenant.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }">
                            ${tenant.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                    <p class="text-sm text-slate-500 mt-1">
                        ${escapeHtml(tenant.slug)} · ${tenant.usersCount} usuario(s) · ${tenant.openTickets} ticket(s) abierto(s)
                    </p>
                </div>

                <div class="flex gap-2">
                    <button
                        onclick="accessTenant(${tenant.id})"
                        class="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-semibold">
                        Acceder
                    </button>

                    <button
                        onclick="editTenant(${tenant.id})"
                        title="Editar empresa"
                        class="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                        ✏️
                    </button>

                    <button
                        onclick="toggleTenant(${tenant.id})"
                        title="${tenant.isActive ? 'Desactivar empresa' : 'Activar empresa'}"
                        class="w-10 h-10 ${
                            tenant.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } rounded-lg">
                        ${tenant.isActive ? '🚫' : '✅'}
                    </button>
                </div>

            </div>
        `;
    });
};

document.getElementById('tenantForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
        name: document.getElementById('name').value,
        slug: document.getElementById('slug').value || undefined
    };

    const response = await fetch(`${API_URL}/tenants`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || 'Error al crear la empresa');
        return;
    }

    document.getElementById('tenantForm').reset();
    loadTenants();
});

const editTenant = (tenantId) => {
    const tenant = tenantsCache.find(t => t.id === tenantId);
    if (!tenant) return;

    document.getElementById('editTenantId').value = tenant.id;
    document.getElementById('editTenantName').value = tenant.name || '';
    document.getElementById('editTenantLegalName').value = tenant.legalName || '';
    document.getElementById('editTenantTaxId').value = tenant.taxId || '';

    document.getElementById('editTenantModal').classList.remove('hidden');
};

window.editTenant = editTenant;

const closeEditTenantModal = () => {
    document.getElementById('editTenantModal').classList.add('hidden');
};

window.closeEditTenantModal = closeEditTenantModal;

const saveTenantChanges = async () => {
    const tenantId = document.getElementById('editTenantId').value;

    const response = await fetch(`${API_URL}/tenants/${tenantId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
            name: document.getElementById('editTenantName').value,
            legalName: document.getElementById('editTenantLegalName').value,
            taxId: document.getElementById('editTenantTaxId').value
        })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || 'Error al actualizar la empresa');
        return;
    }

    closeEditTenantModal();
    loadTenants();
};

window.saveTenantChanges = saveTenantChanges;

const toggleTenant = async (tenantId) => {
    const tenant = tenantsCache.find(t => t.id === tenantId);
    if (!tenant) return;

    const confirmed = confirm(
        tenant.isActive
            ? `¿Desactivar ${tenant.name}? Los usuarios de esta empresa perderán acceso operativo.`
            : `¿Activar ${tenant.name} nuevamente?`
    );

    if (!confirmed) return;

    const response = await fetch(`${API_URL}/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !tenant.isActive })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || 'Error al actualizar el estado de la empresa');
        return;
    }

    loadTenants();
};

window.toggleTenant = toggleTenant;

loadTenants();
