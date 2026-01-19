import { Model } from './api.js';
import { State } from './state.js';
import { showToast } from './utils.js';

function hexToRgba(hex, alpha) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}

export const CalendarController = {
    date: new Date(),
    allUsersCache: [],
    selectedUsernames: [],
    
    cachedReminders: [],
    currentFilterColor: 'ALL',
    currentSearchText: '', 
    
    renderId: 0,
    activeMenuReminder: null, 
    currentEditingReminder: null,

    // --- KONTROLA VLASTNICTVÍ ---
    isOwner(reminder) {
        const currentUser = State.currentUser.username;
        // Ošetření různých formátů, které může backend poslat
        if (typeof reminder.isOwner === 'boolean') return reminder.isOwner;
        if (reminder.owner && typeof reminder.owner === 'object') return reminder.owner.username === currentUser;
        if (typeof reminder.owner === 'string') return reminder.owner === currentUser;
        return false;
    },

    init() { 
        this.render(); 
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-menu') && !e.target.closest('.reminder-tag')) {
                this.closeActionMenu();
            }
        });
        document.addEventListener('scroll', () => this.closeActionMenu(), true);
    },

    goToToday() {
        this.date = new Date();
        this.render();
    },

    changeMonth(step) {
        this.date.setMonth(this.date.getMonth() + step);
        this.render();
    },

    // --- VYKRESLOVÁNÍ ---
    async render() {
        const myRenderId = ++this.renderId;
        const grid = document.getElementById('calendarGrid');
        
        document.getElementById('monthDisplay').innerText = 
            this.date.toLocaleString('cs-CZ', { month: 'long', year: 'numeric' });

        grid.innerHTML = '';
        
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay(); 
        const emptyCells = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        for(let j=0; j<emptyCells; j++) {
            const empty = document.createElement('div');
            empty.className = 'day-cell';
            empty.style.backgroundColor = '#fafafa';
            grid.appendChild(empty);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            if (this.renderId !== myRenderId) return;

            const dayString = i < 10 ? `0${i}` : i;
            const monthReal = month + 1;
            const monthString = monthReal < 10 ? `0${monthReal}` : monthReal;
            const dateSql = `${year}-${monthString}-${dayString}`;

            const cell = document.createElement('div');
            cell.className = 'day-cell';

            // Drag & Drop zóna
            cell.ondragover = (e) => { e.preventDefault(); cell.classList.add('drag-over'); };
            cell.ondragleave = () => { cell.classList.remove('drag-over'); };
            cell.ondrop = (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                const reminderData = e.dataTransfer.getData('text/plain');
                if (reminderData) this.moveReminder(JSON.parse(reminderData), dateSql);
            };

            const now = new Date();
            if (now.getMonth() === month && now.getFullYear() === year && i === now.getDate()) {
                cell.classList.add('today');
            }

            const dayName = new Date(year, month, i).toLocaleDateString('cs-CZ', { weekday: 'short' });
            cell.innerHTML = `<div class="day-header-wrapper"><span class="mobile-day-name">${dayName}</span><div class="day-number">${i}</div></div>`;
            
            cell.addEventListener('click', (e) => {
                 if(e.target === cell || e.target.classList.contains('day-header-wrapper')) {
                    this.openCreateModal(dateSql);
                 }
            });

            let reminders = await Model.getReminders(dateSql);
            if (this.renderId !== myRenderId) return;
            reminders = reminders.filter(r => r.participants.some(p => p.username === State.currentUser.username));
            reminders.sort((a, b) => (a.allDay === b.allDay) ? 0 : a.allDay ? -1 : 1);

            const MAX_VISIBLE = 2;
            const itemsToShow = reminders.length > (MAX_VISIBLE + 1) ? reminders.slice(0, MAX_VISIBLE) : reminders;

            itemsToShow.forEach(rem => {
                const div = document.createElement('div');
                div.className = 'reminder-tag';
                
                const isOwner = this.isOwner(rem);
                // Drag & Drop povolen jen Ownerovi
                div.draggable = isOwner;
                if (!isOwner) div.style.cursor = 'pointer';

                div.ondragstart = (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify(rem));
                    setTimeout(() => div.classList.add('dragging'), 0);
                    this.closeActionMenu();
                };
                div.ondragend = () => {
                    div.classList.remove('dragging');
                    document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('drag-over'));
                };

                const tagColor = rem.color || '#007AFF';
                div.style.borderLeft = `3px solid ${tagColor}`;
                
                if (rem.allDay) {
                    div.innerText = rem.title; 
                    div.style.backgroundColor = tagColor; 
                    div.style.color = "#fff";
                } else {
                    const timeShort = rem.reminderTime ? rem.reminderTime.substring(0, 5) : "";
                    div.innerText = `${timeShort} ${rem.title}`; 
                    div.style.color = 'var(--text-main)';
                    div.style.backgroundColor = hexToRgba(tagColor, 0.15);
                }

                if (rem.participants.length > 1) {
                    const icon = document.createElement('span');
                    icon.innerText = ' 👥';
                    icon.style.fontSize = '10px';
                    div.appendChild(icon);
                }

                // Tooltip s vlastníkem
                const tooltip = document.createElement('span');
                tooltip.className = 'reminder-tooltip';
                tooltip.innerText = rem.title; 
                
                let ownerName = (typeof rem.owner === 'object') ? rem.owner.username : rem.owner;
                if (ownerName) {
                    const oSpan = document.createElement('div');
                    oSpan.style.fontSize = '10px';
                    oSpan.style.color = '#ccc';
                    oSpan.innerText = `👑 ${ownerName}`;
                    tooltip.appendChild(oSpan);
                }
                div.appendChild(tooltip);

                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openActionMenu(e, rem, dateSql);
                });
                
                cell.appendChild(div);
            });

            if (reminders.length > itemsToShow.length) {
                const moreBtn = document.createElement('div');
                moreBtn.className = 'more-events-btn';
                moreBtn.innerText = `+ ${reminders.length - itemsToShow.length} dalších`;
                moreBtn.onclick = (e) => { e.stopPropagation(); this.openDayDetail(dateSql, reminders); };
                cell.appendChild(moreBtn);
            }

            grid.appendChild(cell);
        }
    },

    // --- MENU (Bublina) ---
    openActionMenu(e, reminder, dateSql) {
        this.activeMenuReminder = { ...reminder, dateSql };
        const menu = document.getElementById('reminderActionMenu');
        
        // Zde si musíte zajistit, že máte v HTML ID pro tlačítka v menu
        // Předpokládám strukturu: 
        // <div id="reminderActionMenu"> <button id="menuEditBtn">...</button> <button id="menuDeleteBtn">...</button> </div>
        
        // Pokud nemáte ID, najdeme je podle třídy, ale bezpečnější je ID. 
        // Pro kompatibilitu s vaším předchozím kódem zkusím najít tlačítka.
        // TIP: V index.html přidejte id="menuEditBtn" a id="menuDeleteBtn"
        
        const isOwner = this.isOwner(reminder);
        
        // Hledání tlačítek (upravte selektory dle vašeho HTML, pokud nemáte ID)
        let editBtn = document.getElementById('menuEditBtn');
        let deleteBtn = document.getElementById('menuDeleteBtn');

        // Fallback pokud nemáte ID v HTML (najde první a druhé tlačítko)
        if (!editBtn) editBtn = menu.querySelector('button:first-child');
        if (!deleteBtn) deleteBtn = menu.querySelector('button:last-child');

        if (isOwner) {
            editBtn.innerHTML = '✏️ Upravit';
            deleteBtn.innerHTML = '🗑️ Smazat';
            deleteBtn.style.color = '#FF3B30';
        } else {
            editBtn.innerHTML = '👁️ Detail';
            deleteBtn.innerHTML = '👋 Odejít';
            deleteBtn.style.color = '#FF9500';
        }

        menu.style.display = 'flex';
        let top = e.clientY + 10;
        let left = e.clientX;
        if (top + 100 > window.innerHeight) top = e.clientY - 100;
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    },

    closeActionMenu() {
        const menu = document.getElementById('reminderActionMenu');
        if (menu) menu.style.display = 'none';
        this.activeMenuReminder = null;
    },

    handleMenuEdit() {
        if (this.activeMenuReminder) {
            this.openEditModal(this.activeMenuReminder, this.activeMenuReminder.dateSql);
            this.closeActionMenu();
        }
    },

    async handleMenuDelete() {
        if (!this.activeMenuReminder) return;
        const rem = this.activeMenuReminder;
        const isOwner = this.isOwner(rem);

        // Text potvrzení podle role
        const msg = isOwner 
            ? `Opravdu smazat "${rem.title}"? Událost bude odstraněna všem.` 
            : `Chcete opustit událost "${rem.title}"?`;

        if (confirm(msg)) {
            // Voláme DELETE endpoint. Backend rozhodne (Delete vs Leave)
            if (await Model.deleteReminder(rem.id)) {
                showToast(isOwner ? "Smazáno." : "Opustili jste událost.", 'success');
                this.render();
            } else {
                showToast("Chyba při zpracování.", 'error');
            }
        }
        this.closeActionMenu();
    },

    // --- MODAL (Editace / Detail) ---
    async openEditModal(reminder, dateStr) {
        this.resetModal();
        this.currentEditingReminder = reminder; 

        const isOwner = this.isOwner(reminder);

        document.getElementById('modalTitle').innerText = isOwner ? "Upravit událost" : "Detail události";
        document.getElementById('reminderId').value = reminder.id;
        document.getElementById('reminderTitle').value = reminder.title;
        document.getElementById('reminderDesc').value = reminder.description || "";
        document.getElementById('selectedDate').value = dateStr;

        // --- ZAMČENÍ POLÍ PRO HOSTA ---
        const inputsToLock = ['reminderTitle', 'reminderDesc', 'reminderTime', 'reminderAllDay', 'userSearchInput', 'customColorInput'];
        inputsToLock.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.disabled = !isOwner;
        });

        const colorContainer = document.querySelector('.color-options');
        if (colorContainer) {
            colorContainer.style.pointerEvents = isOwner ? 'auto' : 'none';
            colorContainer.style.opacity = isOwner ? '1' : '0.6';
        }

        // Tlačítka dole
        const deleteBtn = document.getElementById('deleteBtn');
        const saveBtn = document.getElementById('saveReminderBtn');
        deleteBtn.style.display = 'block'; 

        if (isOwner) {
            deleteBtn.innerText = "Smazat";
            deleteBtn.style.color = "#FF3B30";
            saveBtn.style.display = 'block'; 
        } else {
            deleteBtn.innerText = "Opustit událost";
            deleteBtn.style.color = "#FF9500";
            saveBtn.style.display = 'none'; // Host nemůže ukládat
        }

        // Nastavení hodnot formuláře
        const savedColor = reminder.color || '#007AFF'; 
        document.getElementById('selectedColor').value = savedColor;
        document.getElementById('customColorInput').value = savedColor;
        document.querySelectorAll('.color-circle').forEach(el => el.classList.remove('selected'));
        const matchingCircle = document.querySelector(`.color-circle[data-color="${savedColor}"]`);
        
        const labelSpan = document.getElementById('activeColorLabel');
        if (matchingCircle) {
            matchingCircle.classList.add('selected');
            if(labelSpan) labelSpan.innerText = matchingCircle.getAttribute('data-name');
        } else if(labelSpan) {
            labelSpan.innerText = "Vlastní";
        }

        document.getElementById('reminderAllDay').checked = reminder.allDay;
        const timeInput = document.getElementById('reminderTime');
        if (timeInput) timeInput.value = reminder.reminderTime ? reminder.reminderTime.substring(0, 5) : '';
        this.toggleTimeInput();

        const participants = reminder.participants.map(p => p.username).filter(n => n !== State.currentUser.username);
        await this.prepareUserList(participants);
        
        // Zamčení seznamu účastníků pro hosta
        if (!isOwner) {
            const userContainer = document.getElementById('userListContainer');
            if(userContainer) userContainer.style.pointerEvents = 'none';
        }

        this.validateForm();
        this.showModal();
    },

    // --- ULOŽENÍ ---
    async saveOrUpdate() {
        // Bezpečnostní pojistka na frontendu
        if (this.currentEditingReminder && !this.isOwner(this.currentEditingReminder)) return;

        const id = document.getElementById('reminderId').value;
        const title = document.getElementById('reminderTitle').value;
        const color = document.getElementById('selectedColor').value;
        const desc = document.getElementById('reminderDesc').value;
        const date = document.getElementById('selectedDate').value;
        const timeVal = document.getElementById('reminderTime').value;
        const allDay = document.getElementById('reminderAllDay').checked;
        const timeToSend = (timeVal && !allDay) ? timeVal + ":00" : null;

        if (!title) return showToast("Zadejte název události!", 'error');

        const finalUsernames = [...this.selectedUsernames];
        if (!finalUsernames.includes(State.currentUser.username)) finalUsernames.push(State.currentUser.username);

        const data = { title, description: desc, date, time: timeToSend, allDay, usernames: finalUsernames, color };
        
        if (id ? await Model.updateReminder(id, data) : await Model.saveReminder(data)) {
            showToast("Uloženo!", 'success');
            this.closeModal();
            this.render();
        } else {
            showToast("Chyba při ukládání.", 'error');
        }
    },

    // --- SMAZÁNÍ / ODCHOD (z Modalu) ---
    async deleteReminder() {
        const id = document.getElementById('reminderId').value;
        if (!id) return;
        
        const isOwner = this.currentEditingReminder ? this.isOwner(this.currentEditingReminder) : true;
        const msg = isOwner ? "Opravdu smazat? Zmizí všem." : "Opustit tuto událost?";

        if (confirm(msg)) {
            if (await Model.deleteReminder(id)) {
                showToast(isOwner ? "Smazáno." : "Opustili jste událost.", 'success');
                this.closeModal();
                this.render();
            } else {
                showToast("Chyba při zpracování.", 'error');
            }
        }
    },

    // --- OSTATNÍ FUNKCE (Search, Move, Prepare...) ---
    
    async showAllReminders() {
        const modal = document.getElementById('allRemindersModal');
        document.getElementById('allRemindersList').innerHTML = '<div style="text-align:center;">Načítám...</div>';
        this.currentSearchText = '';
        const searchInput = document.getElementById('searchAllInput');
        if (searchInput) searchInput.value = '';
        searchInput.style.display = 'flex';

        // const reminderTitle = document.getElementById('remindersWindowTitle');
        // reminderTitle.value = 'Vsechny me ukoly';

        document.getElementById('remindersWindowTitle').textContent = "Vsechny me ukoly";

        modal.style.display = 'flex';
        this.cachedReminders = await Model.getAllReminders();
        this.renderFilters();
        this.renderFilteredList();
    },

    handleSearch(input) {
        this.currentSearchText = input.value.toLowerCase();
        this.renderFilteredList();
    },

    renderFilters() {
        const container = document.getElementById('filterContainer');
        container.innerHTML = '';
        const colors = [{l:'Vše',c:'ALL'},{l:'Práce',c:'#007AFF'},{l:'Osobní',c:'#34C759'},{l:'Důležité',c:'#FF3B30'},{l:'Ostatní',c:'#FF9500'},{l:'Zábava',c:'#AF52DE'}];
        colors.forEach(o => {
            const btn = document.createElement('div');
            btn.className = `filter-chip ${this.currentFilterColor===o.c?'active':''}`;
            btn.innerHTML = (o.c!=='ALL'?`<div class="filter-dot" style="background:${o.c}"></div>`:'')+o.l;
            btn.onclick=()=>{this.currentFilterColor=o.c;this.renderFilters();this.renderFilteredList();};
            container.appendChild(btn);
        });
    },

    renderFilteredList() {
        const list = document.getElementById('allRemindersList');
        list.innerHTML = '';
        let filtered = this.cachedReminders.filter(rem => {
            const rColor = rem.color || '#007AFF';
            const matchColor = (this.currentFilterColor === 'ALL') || (rColor.toLowerCase() === this.currentFilterColor.toLowerCase());
            const matchText = rem.title.toLowerCase().includes(this.currentSearchText);
            return matchColor && matchText;
        });

        if (filtered.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Žádné úkoly neodpovídají.</div>';
            return;
        }

        filtered.forEach(rem => {
           const d = document.createElement('div');
           d.style.cssText = `padding:10px;background:var(--bg-input);border-radius:8px;border-left:4px solid ${rem.color||'#007AFF'};cursor:pointer;margin-bottom:10px`;
           
           const t = document.createElement('div'); t.style.fontWeight = 'bold'; t.innerText = rem.title;
           d.appendChild(t);

           const dt = document.createElement('div'); dt.style.fontSize = '12px'; dt.style.color = '#888';
           dt.innerText = new Date(rem.reminderDate).toLocaleDateString('cs-CZ');
           d.appendChild(dt);
           
           d.onclick = () => {
               document.getElementById('allRemindersModal').style.display = 'none'; //tady to zkousim
               this.openEditModal(rem, rem.reminderDate);
           };
           list.appendChild(d);
        });
    },

    openDayDetail(date, rems) {
        const modal = document.getElementById('allRemindersModal');
        const list = document.getElementById('allRemindersList');
        modal.querySelector('h3').innerText = `Úkoly: ${new Date(date).toLocaleDateString('cs-CZ')}`;
        document.getElementById('filterContainer').innerHTML = '';
        const searchInput = document.getElementById('searchAllInput');
        if (searchInput) searchInput.style.display = 'none';

        list.innerHTML = '';
        modal.style.display = 'flex';

        rems.forEach(rem => {
           const d = document.createElement('div');
           d.style.cssText = `padding:10px;background:var(--bg-input);border-radius:8px;border-left:4px solid ${rem.color||'#007AFF'};cursor:pointer;margin-bottom:10px`;
           const t = document.createElement('div'); t.style.fontWeight = 'bold'; t.innerText = rem.title;
           d.appendChild(t);
           
           d.onclick = () => {
               modal.style.display = 'none';
               if (searchInput) searchInput.style.display = 'block';
               this.openEditModal(rem, date);
           };
           list.appendChild(d);
        });
    },

    async openCreateModal(dateStr) {
        this.resetModal();
        this.currentEditingReminder = null;
        document.getElementById('modalTitle').innerText = "Nová událost";
        document.getElementById('selectedDate').value = dateStr;
        document.getElementById('deleteBtn').style.display = 'none';
        document.getElementById('saveReminderBtn').style.display = 'block';
        
        ['reminderTitle', 'reminderDesc', 'reminderTime', 'reminderAllDay', 'userSearchInput', 'customColorInput'].forEach(id => {
             const el = document.getElementById(id); if(el) el.disabled = false;
        });
        if(document.querySelector('.color-options')) document.querySelector('.color-options').style.pointerEvents='auto';
        if(document.getElementById('userListContainer')) document.getElementById('userListContainer').style.pointerEvents='auto';
        
        const firstCircle = document.querySelector('.color-circle');
        if(firstCircle) this.selectColor(firstCircle);

        const timeInput = document.getElementById('reminderTime');
        if (timeInput) timeInput.value = this.getSmartTime(); 

        document.getElementById('reminderAllDay').checked = false;
        this.toggleTimeInput();

        await this.prepareUserList([]);
        this.validateForm();
        this.showModal();
        setTimeout(() => document.getElementById('reminderTitle').focus(), 50);
    },

    async moveReminder(reminder, newDate) {
        if (!this.isOwner(reminder)) {
            showToast("Nemáte právo přesunout tuto událost.", 'error');
            return;
        }
        if (reminder.reminderDate === newDate) return;
        const updatedData = {
            title: reminder.title, description: reminder.description, color: reminder.color,
            allDay: reminder.allDay, time: reminder.reminderTime, date: newDate,
            usernames: reminder.participants.map(p => p.username)
        };
        if (await Model.updateReminder(reminder.id, updatedData)) {
            showToast(`Přesunuto na ${new Date(newDate).toLocaleDateString('cs-CZ')}`, 'success');
            this.render();
        } else {
            showToast("Chyba při přesunu", 'error');
        }
    },

    getSmartTime() {
        const now = new Date();
        let hours = now.getHours() + 1;
        if (hours >= 24) hours = 0;
        return `${hours.toString().padStart(2, '0')}:00`;
    },

    toggleTimeInput() {
        const isAllDay = document.getElementById('reminderAllDay').checked;
        const timeInput = document.getElementById('reminderTime');
        if (isAllDay) {
            timeInput.value = ''; timeInput.disabled = true; timeInput.style.opacity = '0.5';
        } else {
            timeInput.disabled = false; timeInput.style.opacity = '1';
        }
    },

    validateForm() {
        const titleInput = document.getElementById('reminderTitle');
        const saveBtn = document.getElementById('saveReminderBtn');
        if (!titleInput || !saveBtn) return;
        saveBtn.disabled = titleInput.value.trim() === "";
    },

    showModal() {
        const modal = document.getElementById('reminderModal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    },

    resetModal() {
        document.getElementById('reminderId').value = '';
        document.getElementById('reminderTitle').value = '';
        document.getElementById('reminderDesc').value = '';
        document.getElementById('userSearchInput').value = '';
        this.selectedUsernames = [];
    },

    closeModal() {
        const modal = document.getElementById('reminderModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    },

    async prepareUserList(preselectedNames = []) {
        if (this.allUsersCache.length === 0) this.allUsersCache = await Model.getAllUsers();
        this.selectedUsernames = preselectedNames;
        this.renderUserList();
    },

    renderUserList() {
        const container = document.getElementById('userListContainer');
        const filterText = document.getElementById('userSearchInput')?.value.toLowerCase() || "";
        container.innerHTML = '';
        this.allUsersCache.filter(u => u.username !== State.currentUser.username && u.username.toLowerCase().includes(filterText))
            .forEach(user => {
                const div = document.createElement('div');
                div.className = `user-item ${this.selectedUsernames.includes(user.username) ? 'selected' : ''}`;
                
                // Bezpečný rendering jména
                div.innerHTML = '';
                const cb = document.createElement('div'); cb.className = 'user-checkbox';
                const nameSpan = document.createElement('span'); nameSpan.innerText = user.username;
                div.appendChild(cb);
                div.appendChild(nameSpan);
                
                div.onclick = () => {
                    this.selectedUsernames.includes(user.username) ? 
                        this.selectedUsernames = this.selectedUsernames.filter(n => n !== user.username) : 
                        this.selectedUsernames.push(user.username);
                    this.renderUserList();
                };
                container.appendChild(div);
            });
    },

    filterUsers() { this.renderUserList(); },
    
    selectColor(el){
        document.querySelectorAll('.color-circle').forEach(e=>e.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('selectedColor').value=el.dataset.color;
        if(document.getElementById('activeColorLabel')) document.getElementById('activeColorLabel').innerText=el.dataset.name;
    },
    
    selectCustomColor(inp){
        document.querySelectorAll('.color-circle').forEach(e=>e.classList.remove('selected'));
        document.getElementById('selectedColor').value=inp.value;
        if(document.getElementById('activeColorLabel')) document.getElementById('activeColorLabel').innerText="Vlastní";
    }
};