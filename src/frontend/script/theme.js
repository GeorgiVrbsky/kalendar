export const ThemeController = {
    init() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            this.updateIcon(true);
        } else {
            this.updateIcon(false);
        }
    },
    toggle() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateIcon(isDark);
    },
    updateIcon(isDark) {
        const btn = document.getElementById('themeBtn');
        if (btn) btn.innerText = isDark ? '☀️' : '🌙';
    }
};