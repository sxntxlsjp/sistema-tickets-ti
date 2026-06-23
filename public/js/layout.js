let mobileMenuOpen = false;

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

    const menuItems = user.role === 'ADMIN'
        ? [
            { key: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html' },
            { key: 'tickets', label: 'Tickets', icon: '🎫', href: 'tickets.html' },
            { key: 'create-ticket', label: 'Nuevo Ticket', icon: '➕', href: 'create-ticket.html' },
            { key: 'users', label: 'Usuarios', icon: '👥', href: 'users.html' },
            { key: 'countries', label: 'Países', icon: '🌎', href: 'countries.html' },
            { key: 'profile', label: 'Mi Perfil', icon: '👤', href: 'profile.html' }
        ]
        : [
            { key: 'user-home', label: 'Dashboard', icon: '📊', href: 'user-home.html' },
            { key: 'tickets', label: 'Mis Tickets', icon: '🎫', href: 'tickets.html' },
            { key: 'create-ticket', label: 'Crear Ticket', icon: '➕', href: 'create-ticket.html' },
            { key: 'profile', label: 'Mi Perfil', icon: '👤', href: 'profile.html' }
        ];

    sidebar.className =
        'w-full bg-[#f1f4f8] text-slate-800 px-6 py-4 shadow-sm sticky top-0 z-40';

    sidebar.innerHTML = `
        <div class="flex items-center justify-between gap-6">

            <a href="${user.role === 'ADMIN' ? 'dashboard.html' : 'user-home.html'}" class="flex items-center shrink-0">
                <img
                    src="assets/logoprovefabrica.svg"
                    alt="Logo"
                    class="h-12 object-contain"
                >
            </a>

            <nav class="hidden lg:flex items-center gap-2 ml-auto">
                ${menuItems.map(item => `
                    <a href="${item.href}"
                       title="${item.label}"
                       class="flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold ${
                            activePage === item.key
                                ? 'bg-white shadow-sm'
                                : 'hover:bg-white hover:shadow-sm'
                        }">
                        <span>${item.icon}</span>
                        <span>${item.label}</span>
                    </a>
                `).join('')}

                <button onclick="logout()"
                        title="Cerrar sesión"
                        class="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-sm font-semibold">
                    <span>🚪</span>
                    <span>Cerrar sesión</span>
                </button>

                <div class="flex items-center gap-3 bg-white rounded-2xl py-2 px-3 shadow-sm ml-2">
                    ${
                        user.profileImage
                            ? `
                            <img
                                src="${user.profileImage}"
                                class="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            >
                            `
                            : `
                            <div class="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center font-bold text-white shrink-0">
                                ${initials}
                            </div>
                            `
                    }

                    <div class="hidden xl:block">
                        <p class="text-sm font-semibold leading-tight">${user.name}</p>
                        <p class="text-xs text-slate-500">
                            ${user.jobTitle || (user.role === 'ADMIN' ? 'Administrador' : 'Usuario')}
                        </p>
                    </div>
                </div>
            </nav>

            <button onclick="toggleMobileMenu()"
                    class="lg:hidden w-10 h-10 rounded-xl bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center shadow-sm">
                ☰
            </button>

        </div>

        <nav id="mobileMenu" class="${mobileMenuOpen ? 'block' : 'hidden'} lg:hidden mt-4 space-y-2">
            ${menuItems.map(item => `
                <a href="${item.href}"
                   title="${item.label}"
                   class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activePage === item.key
                            ? 'bg-white shadow-sm'
                            : 'hover:bg-white hover:shadow-sm'
                    }">
                    <span class="text-xl">${item.icon}</span>
                    <span class="font-semibold">${item.label}</span>
                </a>
            `).join('')}

            <button onclick="logout()"
                    title="Cerrar sesión"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm w-full transition-all">
                <span class="text-xl">🚪</span>
                <span class="font-semibold">Cerrar sesión</span>
            </button>
        </nav>
    `;
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
    window.location.href = 'index.html';
};