let mobileMenuOpen = false;

const escapeLayoutHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
};

const themeToggleMarkup = () => {
    const resolved = typeof resolveTheme === 'function' && typeof getThemePreference === 'function'
        ? resolveTheme(getThemePreference())
        : 'light';

    return `
        <button
            onclick="toggleTheme()"
            title="Cambiar tema"
            aria-label="Cambiar entre modo claro y oscuro"
            class="btn btn-icon">
            <i data-lucide="${resolved === 'dark' ? 'sun' : 'moon'}"></i>
        </button>
    `;
};

const renderLayout = (activePage = '') => {
    const sidebar = document.getElementById('sidebar');

    if (!sidebar) return;

    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const initials = user.name
        ? user.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
        : 'US';

    const activeTenant = typeof getActiveTenant === 'function' ? getActiveTenant() : null;
    const homeHref = user.role === 'ADMIN' ? 'dashboard.html' : 'user-home.html';

    const adminChildren = [
        { key: 'users', label: 'Usuarios', icon: 'users', href: 'users.html' },
        { key: 'countries', label: 'Países', icon: 'globe', href: 'countries.html' },
        { key: 'ticket-types', label: 'Tipos de Ticket', icon: 'tags', href: 'ticket-types.html' },
        { key: 'priorities', label: 'Prioridades', icon: 'flag', href: 'priorities.html' },
        { key: 'settings', label: 'Configuración', icon: 'settings', href: 'settings.html' }
    ];

    if (user.isSuperAdmin) {
        adminChildren.push({ key: 'tenants', label: 'Empresas', icon: 'building-2', href: 'tenants.html' });
    }

    const menuItems = user.role === 'ADMIN'
        ? [
            { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: 'dashboard.html' },
            { key: 'tickets', label: 'Tickets', icon: 'ticket', href: 'tickets.html' },
            { key: 'create-ticket', label: 'Nuevo Ticket', icon: 'circle-plus', href: 'create-ticket.html' },
            {
                key: 'admin',
                label: 'Administración',
                icon: 'shield',
                children: adminChildren
            },
            { key: 'profile', label: 'Mi Perfil', icon: 'user-circle', href: 'profile.html' }
        ]
        : [
            { key: 'user-home', label: 'Dashboard', icon: 'layout-dashboard', href: 'user-home.html' },
            { key: 'tickets', label: 'Mis Tickets', icon: 'ticket', href: 'tickets.html' },
            { key: 'create-ticket', label: 'Crear Ticket', icon: 'circle-plus', href: 'create-ticket.html' },
            { key: 'profile', label: 'Mi Perfil', icon: 'user-circle', href: 'profile.html' }
        ];

    sidebar.className = 'sticky top-0 z-40';
    sidebar.style.zIndex = 'var(--z-sticky)';

    sidebar.innerHTML = `
        <div
            style="background-color: var(--surface-card); border-bottom: 1px solid var(--border-default);"
            class="px-4 md:px-6 py-3 shadow-sm">

            <div class="flex items-center justify-between gap-4">

                <a href="${homeHref}" class="logo-chip shrink-0" aria-label="Ir al inicio">
                    <img
                        src="assets/logo.png"
                        alt="MasterDiv Desk"
                        class="h-8 object-contain"
                    >
                </a>

                <nav class="hidden lg:flex items-center gap-1 ml-auto">
                ${menuItems.map(item => {

                    if (item.children) {

                        const childActive = item.children.some(
                            child => child.key === activePage
                        );

                        return `
                            <div class="relative group">

                                <button
                                    class="btn btn-ghost"
                                    style="${childActive ? 'background-color: var(--surface-sunken); color: var(--text-primary);' : ''}">

                                    <i data-lucide="${item.icon}"></i>
                                    <span>${item.label}</span>
                                    <i data-lucide="chevron-down" class="icon-sm transition-transform group-hover:rotate-180"></i>

                                </button>

                                <div
                                    style="background-color: var(--surface-card); border: 1px solid var(--border-default);"
                                    class="absolute right-0 mt-2 w-60 rounded-2xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                                    role="menu">

                                    ${item.children.map(child => `
                                        <a
                                            href="${child.href}"
                                            role="menuitem"
                                            style="color: var(--text-secondary);"
                                            class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-sunken)] first:rounded-t-2xl last:rounded-b-2xl transition">

                                            <i data-lucide="${child.icon}" class="icon-sm"></i>
                                            <span class="font-medium text-sm">${child.label}</span>

                                        </a>
                                    `).join('')}

                                </div>

                            </div>
                        `;
                    }

                    const isActive = activePage === item.key;

                    return `
                        <a href="${item.href}"
                        title="${item.label}"
                        class="btn btn-ghost"
                        style="${isActive ? 'background-color: var(--surface-sunken); color: var(--text-primary);' : ''}">

                            <i data-lucide="${item.icon}"></i>
                            <span>${item.label}</span>

                        </a>
                    `;

                }).join('')}

                    ${activeTenant ? `
                        <a href="select-tenant.html"
                           title="Cambiar de empresa"
                           class="btn btn-ghost hidden md:inline-flex ml-1">
                            <i data-lucide="repeat" class="icon-sm"></i>
                            <span class="max-w-[9rem] truncate">${escapeLayoutHtml(activeTenant.name)}</span>
                        </a>
                    ` : ''}

                    ${themeToggleMarkup()}

                    <button onclick="logout()"
                            title="Cerrar sesión"
                            aria-label="Cerrar sesión"
                            class="btn btn-ghost">
                        <i data-lucide="log-out" class="icon-sm"></i>
                        <span class="hidden xl:inline">Cerrar sesión</span>
                    </button>

                    <div
                        style="background-color: var(--surface-sunken);"
                        class="flex items-center gap-3 rounded-2xl py-1.5 px-3 ml-1">
                        ${
                            user.profileImage
                                ? `
                                <img
                                    src="${user.profileImage}"
                                    class="w-8 h-8 rounded-full object-cover border shrink-0"
                                    style="border-color: var(--border-default);"
                                >
                                `
                                : `
                                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                                     style="background-color: var(--color-primary-blue);">
                                    ${initials}
                                </div>
                                `
                        }

                        <div class="hidden xl:block leading-tight">
                            <p class="text-sm font-semibold" style="color: var(--text-primary);">${escapeLayoutHtml(user.name)}</p>
                            <p class="text-xs" style="color: var(--text-muted);">
                                ${escapeLayoutHtml(user.jobTitle || (user.role === 'ADMIN' ? 'Administrador' : 'Usuario'))}
                            </p>
                        </div>
                    </div>
                </nav>

                <div class="flex items-center gap-2 lg:hidden">
                    ${themeToggleMarkup()}

                    <button onclick="toggleMobileMenu()"
                            aria-label="Abrir menú"
                            aria-expanded="${mobileMenuOpen}"
                            class="btn btn-icon">
                        <i data-lucide="${mobileMenuOpen ? 'x' : 'menu'}"></i>
                    </button>
                </div>

            </div>

            <nav id="mobileMenu" class="${mobileMenuOpen ? 'block' : 'hidden'} lg:hidden mt-3 space-y-1 pb-2">
                ${menuItems.flatMap(item => item.children
                    ? item.children.map(child => ({ ...child }))
                    : [item]
                ).map(item => `
                    <a href="${item.href}"
                       title="${item.label}"
                       class="btn btn-ghost btn-block justify-start"
                       style="${activePage === item.key ? 'background-color: var(--surface-sunken); color: var(--text-primary);' : ''}">
                        <i data-lucide="${item.icon}"></i>
                        <span>${item.label}</span>
                    </a>
                `).join('')}

                ${activeTenant ? `
                    <a href="select-tenant.html"
                       class="btn btn-ghost btn-block justify-start">
                        <i data-lucide="repeat"></i>
                        <span>Cambiar empresa (${escapeLayoutHtml(activeTenant.name)})</span>
                    </a>
                ` : ''}

                <button onclick="logout()"
                        class="btn btn-ghost btn-block justify-start">
                    <i data-lucide="log-out"></i>
                    <span>Cerrar sesión</span>
                </button>
            </nav>

        </div>
    `;

    refreshIcons();
};

const toggleMobileMenu = () => {
    mobileMenuOpen = !mobileMenuOpen;

    const currentPage =
        document.body.dataset.page || '';

    renderLayout(currentPage);
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof clearActiveTenant === 'function') {
        clearActiveTenant();
    }
    window.location.href = 'index.html';
};

document.addEventListener('themechange', () => {
    renderLayout(document.body.dataset.page || '');
});
