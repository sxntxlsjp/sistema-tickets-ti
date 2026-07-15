const token = getToken();

if (!token) {
    window.location.href = 'index.html';
}

const roleLabels = {
    TENANT_ADMIN: 'Administrador',
    AGENT: 'Agente',
    USER: 'Usuario',
    SUPER_ADMIN: 'Super Administrador'
};

const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const loadTenants = async () => {
    const container = document.getElementById('tenantCards');
    const emptyState = document.getElementById('emptyState');

    let tenants = [];

    try {
        const response = await fetch(`${API_URL}/auth/tenants`, {
            headers: authHeaders()
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener la lista de empresas');
        }

        const data = await response.json();
        tenants = data.tenants || [];
    } catch (error) {
        console.error(error);
        emptyState.textContent = 'Ocurrió un error al cargar tus empresas.';
        emptyState.classList.remove('hidden');
        return;
    }

    if (tenants.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    if (tenants.length === 1) {
        applyTenantSelection(tenants[0]);
        return;
    }

    container.innerHTML = tenants.map((tenant, index) => `
        <button
            data-tenant-id="${tenant.id}"
            style="animation-delay: ${index * 60}ms;"
            class="tenant-card card text-left hover:shadow-lg transition-all duration-200">

            <div class="flex items-center gap-4 mb-4">
                ${
                    tenant.logoUrl
                        ? `<img src="${escapeHtml(tenant.logoUrl)}" class="w-12 h-12 rounded-xl object-cover border">`
                        : `<div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white" style="background-color: var(--color-primary-navy);">
                                ${escapeHtml((tenant.name || '?').substring(0, 2).toUpperCase())}
                           </div>`
                }

                <div>
                    <h3 class="text-lg font-bold" style="color: var(--text-primary);">${escapeHtml(tenant.name)}</h3>
                    <span class="badge badge-success mt-1">
                        <i data-lucide="check-circle-2" class="icon-sm"></i>
                        Activa
                    </span>
                </div>
            </div>

            <div class="flex items-center justify-between text-sm">
                <span class="badge badge-blue">
                    <i data-lucide="user" class="icon-sm"></i>
                    ${roleLabels[tenant.role] || tenant.role}
                </span>
                <span class="badge badge-neutral">
                    <i data-lucide="ticket" class="icon-sm"></i>
                    ${tenant.openTickets} abierto(s)
                </span>
            </div>
        </button>
    `).join('');

    lucide.createIcons();

    document.querySelectorAll('.tenant-card').forEach(card => {
        card.addEventListener('click', () => {
            const tenantId = Number(card.dataset.tenantId);
            const tenant = tenants.find(t => t.id === tenantId);
            if (tenant) {
                applyTenantSelection(tenant);
            }
        });
    });
};

loadTenants();
