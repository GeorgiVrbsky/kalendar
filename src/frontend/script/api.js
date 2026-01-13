import { API_URL } from './config.js';

export const Model = {
    // 1. Registrace
    async register(user) {
        try {
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
                credentials: 'include' // Důležité pro konzistenci
            });
            return response.ok;
        } catch (error) {
            console.error("Chyba registrace:", error);
            return false;
        }
    },

    // 2. Login (Server nastaví Cookie)
    async login(username, password) {
        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // <--- Povolí přijetí cookie JSESSIONID
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Chyba přihlášení:", error);
        }
        return null;
    },

    // 3. Logout (Server zničí Cookie)
    async logout() {
        try {
            await fetch(`${API_URL}/users/logout`, { 
                method: 'POST',
                credentials: 'include' // <--- Pošle cookie, aby server věděl, koho odhlásit
            });
        } catch (e) { console.error(e); }
    },

    // 4. Kontrola session (Kdo jsem?) - pro F5 refresh
    async getCurrentUser() {
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                method: 'GET',
                credentials: 'include' // <--- Pošle existující cookie
            });
            if (response.ok) return await response.json();
        } catch (e) { 
            // Nejsme přihlášeni, to je v pořádku
        }
        return null;
    },

    // 5. Ostatní metody (VŠUDE musí být credentials: 'include')
    async getAllUsers() {
        try {
            const response = await fetch(`${API_URL}/users`, {
                credentials: 'include' // <--- Důležité!
            });
            if (response.ok) return await response.json();
        } catch (error) { console.error("Chyba users:", error); }
        return [];
    },

    async getReminders(dateStr) {
        try {
            const response = await fetch(`${API_URL}/reminders?date=${dateStr}`, {
                credentials: 'include' // <--- Důležité!
            });
            if (response.ok) return await response.json();
        } catch (error) { console.warn(`Chyba dat: ${error}`); }
        return [];
    },

    async getAllReminders() {
        try {
            const response = await fetch(`${API_URL}/reminders/all`, {
                credentials: 'include'
            });
            if (response.ok) return await response.json();
        } catch (error) { console.error(error); }
        return [];
    },

    async saveReminder(data) {
        try {
            const response = await fetch(`${API_URL}/reminders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include' // <--- Důležité!
            });
            return response.ok;
        } catch (error) { return false; }
    },

    async updateReminder(id, data) {
        try {
            const response = await fetch(`${API_URL}/reminders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include' // <--- Důležité!
            });
            return response.ok;
        } catch (error) { return false; }
    },

    async deleteReminder(id) {
        try {
            const response = await fetch(`${API_URL}/reminders/${id}`, {
                method: 'DELETE',
                credentials: 'include' // <--- Důležité!
            });
            return response.ok;
        } catch (error) { return false; }
    }
};
