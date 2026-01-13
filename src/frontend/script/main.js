import { AuthController } from './auth.js';
import { CalendarController } from './calendar.js';
import { ThemeController } from './theme.js';
import { Model } from './api.js';

// 1. Zpřístupníme Controllery pro HTML (aby fungovalo onclick="AuthController.login()")
// Protože moduly jsou izolované, HTML na ně nevidí, musíme je dát do okna (window)
window.AuthController = AuthController;
window.CalendarController = CalendarController;
window.ThemeController = ThemeController;

// 2. Init Dark Mode
ThemeController.init();

// 3. Auto-Login při startu
document.addEventListener('DOMContentLoaded', () => {
    Model.getCurrentUser().then(user => {
        if (user) {
            AuthController.initApp(user);
        }
    });

    // 4. Klávesové zkratky (Enter)
    const addEnterListener = (inputId, actionFunction) => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    actionFunction();
                }
            });
        }
    };

    addEnterListener('loginUsername', () => AuthController.login());
    addEnterListener('loginPassword', () => AuthController.login());
    addEnterListener('regUsername', () => AuthController.register());
    addEnterListener('regEmail',    () => AuthController.register());
    addEnterListener('regPassword', () => AuthController.register());
    addEnterListener('reminderTitle', () => CalendarController.saveOrUpdate());
});