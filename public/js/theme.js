/*
  MasterDiv Desk — Theme Provider (Fase 14)
  Light / Dark / System, con persistencia en localStorage.
  Se ejecuta lo antes posible (antes del <body>) para evitar parpadeos.
*/

const THEME_STORAGE_KEY = 'md-theme-preference';

const getSystemTheme = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
};

const getThemePreference = () => {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
};

const resolveTheme = (preference) => {
    return preference === 'system' ? getSystemTheme() : preference;
};

const applyTheme = (preference) => {
    const resolved = resolveTheme(preference);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
};

const setTheme = (preference) => {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
    applyTheme(preference);

    document.dispatchEvent(new CustomEvent('themechange', {
        detail: { preference, resolved: resolveTheme(preference) }
    }));
};

const toggleTheme = () => {
    const current = resolveTheme(getThemePreference());
    setTheme(current === 'dark' ? 'light' : 'dark');
};

applyTheme(getThemePreference());

if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getThemePreference() === 'system') {
            applyTheme('system');
        }
    });
}

window.setTheme = setTheme;
window.toggleTheme = toggleTheme;
window.getThemePreference = getThemePreference;
window.resolveTheme = resolveTheme;
