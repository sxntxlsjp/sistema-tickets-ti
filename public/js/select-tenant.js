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

    container.innerHTML = tenants.map(tenant => `
        <button
            data-tenant-id="${tenant.id}"
            class="tenant-card text-left bg-white rounded-2xl shadow p-6 hover:shadow-lg hover:-translate-y-0.5 transition border border-transparent hover:border-slate-300">

            <div class="flex items-center gap-4 mb-4">
                ${
                    tenant.logoUrl
                        ? `<img src="${escapeHtml(tenant.logoUrl)}" class="w-12 h-12 rounded-xl object-cover border">`
                        : `<div class="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                                ${escapeHtml((tenant.name || '?').substring(0, 2).toUpperCase())}
                           </div>`
                }

                <div>
                    <h3 class="text-lg font-bold text-slate-800">${escapeHtml(tenant.name)}</h3>
                    <span class="inline-block mt-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        Activa
                    </span>
                </div>
            </div>

            <div class="flex items-center justify-between text-sm">
                <span class="font-semibold text-slate-600">
                    ${roleLabels[tenant.role] || tenant.role}
                </span>
                <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    ${tenant.openTickets} ticket(s) abierto(s)
                </span>
            </div>
        </button>
    `).join('');

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
