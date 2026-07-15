const API_URL = `${window.location.origin}/api`;

const getToken = () => {
    return localStorage.getItem('token');
};

const setToken = (token) => {
    localStorage.setItem('token', token);
};

const removeToken = () => {
    localStorage.removeItem('token');
};

const getActiveTenantId = () => {
    return localStorage.getItem('activeTenantId');
};

const getActiveTenant = () => {
    try {
        return JSON.parse(localStorage.getItem('activeTenant'));
    } catch (error) {
        return null;
    }
};

const setActiveTenant = (tenant) => {
    localStorage.setItem('activeTenantId', String(tenant.id));
    localStorage.setItem('activeTenant', JSON.stringify({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl || null,
        role: tenant.role
    }));
};

const clearActiveTenant = () => {
    localStorage.removeItem('activeTenantId');
    localStorage.removeItem('activeTenant');
};

const authHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };

    const tenantId = getActiveTenantId();

    if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
    }

    return headers;
};

const applyTenantSelection = (tenant) => {
    setActiveTenant(tenant);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isEffectiveAdmin = user.isSuperAdmin || tenant.role === 'TENANT_ADMIN';

    user.role = isEffectiveAdmin ? 'ADMIN' : 'USER';
    user.tenantRole = tenant.role;
    localStorage.setItem('user', JSON.stringify(user));

    window.location.href = isEffectiveAdmin ? 'dashboard.html' : 'user-home.html';
};

(() => {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
        const url = typeof input === 'string' ? input : input?.url;

        if (url && url.startsWith(API_URL)) {
            const tenantId = getActiveTenantId();

            if (tenantId && !(init.headers && init.headers['X-Tenant-Id'])) {
                init = {
                    ...init,
                    headers: {
                        ...(init.headers || {}),
                        'X-Tenant-Id': tenantId
                    }
                };
            }
        }

        return nativeFetch(input, init);
    };
})();