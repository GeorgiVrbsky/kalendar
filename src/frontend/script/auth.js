import { Model } from './api.js';
import { State } from './state.js';
import { showToast } from './utils.js';
import { CalendarController } from './calendar.js'; // Abychom mohli spustit kalendář

export const AuthController = {
    isRegistering: false,

    toggleForms() {
        this.isRegistering = !this.isRegistering;
        document.getElementById('login-form').style.display = this.isRegistering ? 'none' : 'block';
        document.getElementById('register-form').style.display = this.isRegistering ? 'block' : 'none';
    },

    async register() {
        const username = document.getElementById('regUsername').value;
        const passwordRaw = document.getElementById('regPassword').value;
        if (!username || !passwordRaw) return showToast("Vyplňte údaje!", 'error');

        const success = await Model.register({ username, password: passwordRaw });
        if (success) {
            showToast("Registrace úspěšná! Přihlašuji...", 'success');
            this.performLogin(username, passwordRaw);
        } else {
            showToast("Uživatel již existuje.", 'error');
        }
    },

    async login() {
        const username = document.getElementById('loginUsername').value;
        const passwordRaw = document.getElementById('loginPassword').value;
        if (!username || !passwordRaw) return showToast("Zadejte údaje.", 'error');
        this.performLogin(username, passwordRaw);
    },

    async performLogin(username, password) {
        const user = await Model.login(username, password);
        if (user) {
            this.initApp(user);
            showToast(`Vítejte, ${user.username}!`, 'success');
        } else {
            showToast("Špatné jméno nebo heslo!", 'error');
        }
    },

    async logout() {
        await Model.logout();
        State.currentUser = null;
        location.reload();
    },

    initApp(user) {
        State.currentUser = user; // Uložíme do global state
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'flex';
        document.getElementById('currentUserDisplay').innerText = `👤 ${user.username}`;
        CalendarController.init();
    }
};