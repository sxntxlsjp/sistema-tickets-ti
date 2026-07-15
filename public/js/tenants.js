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
            <div class="card flex flex-wrap items-center justify-between gap-4">

                <div>
                    <div class="flex items-center gap-3">
                        <h4 class="font-bold" style="color: var(--text-primary);">${escapeHtml(tenant.name)}</h4>
                        <span class="badge ${tenant.isActive ? 'badge-success' : 'badge-danger'}">
                            ${tenant.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                    <p class="text-sm mt-1" style="color: var(--text-muted);">
                        ${escapeHtml(tenant.slug)} · ${tenant.usersCount} usuario(s) · ${tenant.openTickets} ticket(s) abierto(s)
                    </p>
                </div>

                <div class="flex gap-2">
                    <button
                        onclick="accessTenant(${tenant.id})"
                        class="btn btn-secondary btn-sm">
                        <i data-lucide="log-in" class="icon-sm"></i>
                        Acceder
                    </button>

                    <button
                        onclick="editTenant(${tenant.id})"
                        title="Editar empresa"
                        aria-label="Editar empresa"
                        class="btn btn-icon" style="background-color: rgba(37,99,235,0.12); color: var(--color-primary-blue);">
                        <i data-lucide="pencil" class="icon-sm"></i>
                    </button>

                    <button
                        onclick="toggleTenant(${tenant.id})"
                        title="${tenant.isActive ? 'Desactivar empresa' : 'Activar empresa'}"
                        aria-label="${tenant.isActive ? 'Desactivar empresa' : 'Activar empresa'}"
                        class="btn btn-icon"
                        style="${
                            tenant.isActive
                                ? 'background-color: rgba(239,68,68,0.12); color: var(--color-danger);'
                                : 'background-color: rgba(16,185,129,0.14); color: var(--color-success-green);'
                        }">
                        <i data-lucide="${tenant.isActive ? 'ban' : 'check'}" class="icon-sm"></i>
                    </button>
                </div>

            </div>
        `;
    });

    refreshIcons();
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
