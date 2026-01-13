import { Model } from './api.js';
import { State } from './state.js';
import { showToast } from './utils.js';

// --- POMOCNÁ FUNKCE PRO BARVY ---
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
    
    // Data pro filtrování a hledání
    cachedReminders: [],
    currentFilterColor: 'ALL',
    currentSearchText: '', // Pro vyhledávání
    
    renderId: 0,
    activeMenuReminder: null, // Pro akční menu

    init() { 
        this.render(); 
        // Zavření menu při kliknutí jinam
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

    // --- HLAVNÍ FUNKCE VYKRESLOVÁNÍ ---
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

        // Prázdné buňky
        for(let j=0; j<emptyCells; j++) {
            const empty = document.createElement('div');
            empty.className = 'day-cell';
            empty.style.backgroundColor = '#fafafa';
            grid.appendChild(empty);
        }

        // Cyklus dní
        for (let i = 1; i <= daysInMonth; i++) {
            if (this.renderId !== myRenderId) return;

            const dayString = i < 10 ? `0${i}` : i;
            const monthReal = month + 1;
            const monthString = monthReal < 10 ? `0${monthReal}` : monthReal;
            const dateSql = `${year}-${monthString}-${dayString}`;

            const cell = document.createElement('div');
            cell.className = 'day-cell';

            // Drag & Drop
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
                div.draggable = true;
                
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
                    div.innerText = rem.title; // Secure: innerText
                    div.style.backgroundColor = tagColor; 
                    div.style.color = "#fff";
                } else {
                    const timeShort = rem.reminderTime ? rem.reminderTime.substring(0, 5) : "";
                    div.innerText = `${timeShort} ${rem.title}`; // Secure: innerText
                    div.style.color = 'var(--text-main)';
                    div.style.backgroundColor = hexToRgba(tagColor, 0.15);
                }

                // Ikonka pro více účastníků
                if (rem.participants.length > 1) {
                    const icon = document.createElement('span');
                    icon.innerText = ' 👥';
                    icon.style.fontSize = '10px';
                    div.appendChild(icon);
                }

                // --- BEZPEČNÝ TOOLTIP ---
                const tooltip = document.createElement('span');
                tooltip.className = 'reminder-tooltip';
                tooltip.innerText = rem.title; // Název bezpečně
                
                if (rem.participants.length > 1) {
                    const peopleSpan = document.createElement('div');
                    peopleSpan.style.fontSize = '10px';
                    peopleSpan.style.color = '#ccc';
                    peopleSpan.innerText = `👥 ${rem.participants.length} lidé`;
                    tooltip.appendChild(peopleSpan);
                }
                
                if (rem.description) {
                    const descSpan = document.createElement('div');
                    descSpan.style.fontSize = '10px';
                    descSpan.style.color = '#ccc';
                    descSpan.style.marginTop = '4px';
                    descSpan.innerText = rem.description; // Popis bezpečně (innerText)
                    tooltip.appendChild(descSpan);
                }
                div.appendChild(tooltip);
                // -------------------------

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

    openActionMenu(e, reminder, dateSql) {
        this.activeMenuReminder = { ...reminder, dateSql };
        const menu = document.getElementById('reminderActionMenu');
        
        const deleteBtn = menu.querySelector('.delete-opt');
        const isShared = reminder.participants.length > 1;
        deleteBtn.innerHTML = isShared ? '👋 Opustit událost' : '🗑️ Smazat';

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

        if (rem.participants.length > 1) {
            await this.leaveReminder(rem);
        } else {
            if (confirm(`Opravdu smazat "${rem.title}"?`)) {
                await Model.deleteReminder(rem.id);
                showToast("Smazáno.", 'success');
                this.render();
            }
        }
        this.closeActionMenu();
    },

    // --- SEZNAM VŠECH ÚKOLŮ ---
    async showAllReminders() {
        const modal = document.getElementById('allRemindersModal');
        document.getElementById('allRemindersList').innerHTML = '<div style="text-align:center;">Načítám...</div>';
        
        // Reset hledání
        this.currentSearchText = '';
        const searchInput = document.getElementById('searchAllInput');
        if (searchInput) searchInput.value = '';

        modal.style.display = 'flex';
        this.cachedReminders = await Model.getAllReminders();
        this.currentFilterColor = 'ALL';
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

    // --- BEZPEČNÉ VYKRESLENÍ SEZNAMU (DOM Manipulation) ---
    renderFilteredList() {
        const list = document.getElementById('allRemindersList');
        list.innerHTML = ''; // Vyčistit starý obsah

        // Logika filtrování (Barva + Text)
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
           d.style.padding = '10px';
           d.style.background = 'var(--bg-input)';
           d.style.borderRadius = '8px';
           d.style.borderLeft = `4px solid ${rem.color || '#007AFF'}`;
           d.style.cursor = 'pointer';
           d.style.marginBottom = '10px';

           // Název (Bezpečně přes innerText)
           const titleDiv = document.createElement('div');
           titleDiv.style.fontWeight = 'bold';
           titleDiv.innerText = rem.title; 
           d.appendChild(titleDiv);

           // Datum
           const dateDiv = document.createElement('div');
           dateDiv.style.fontSize = '12px';
           dateDiv.style.color = '#888';
           dateDiv.innerText = new Date(rem.reminderDate).toLocaleDateString('cs-CZ');
           d.appendChild(dateDiv);
           
           d.onclick = () => {
               document.getElementById('allRemindersModal').style.display = 'none';
               this.openEditModal(rem, rem.reminderDate);
           };
           list.appendChild(d);
        });
    },

    // --- BEZPEČNÝ DETAIL DNE ---
    openDayDetail(date, rems) {
        const modal = document.getElementById('allRemindersModal');
        const list = document.getElementById('allRemindersList');
        const title = modal.querySelector('h3');
        title.innerText = `Úkoly: ${new Date(date).toLocaleDateString('cs-CZ')}`;

        document.getElementById('filterContainer').innerHTML = ''; // Skrýt filtry pro detail dne
        const searchInput = document.getElementById('searchAllInput');
        if (searchInput) searchInput.style.display = 'none'; // Skrýt hledání pro detail dne

        list.innerHTML = '';
        modal.style.display = 'flex';

        rems.forEach(rem => {
           const d = document.createElement('div');
           d.style.padding = '10px';
           d.style.background = 'var(--bg-input)';
           d.style.borderRadius = '8px';
           d.style.borderLeft = `4px solid ${rem.color || '#007AFF'}`;
           d.style.cursor = 'pointer';
           d.style.marginBottom = '10px';

           // Název (Bezpečně)
           const titleDiv = document.createElement('div');
           titleDiv.style.fontWeight = 'bold';
           titleDiv.innerText = rem.title;
           d.appendChild(titleDiv);
           
           d.onclick = () => {
               modal.style.display = 'none';
               // Znovu zobrazit hledání pro příště
               if (searchInput) searchInput.style.display = 'block';
               this.openEditModal(rem, date);
           };
           list.appendChild(d);
        });
    },

    // --- OSTATNÍ FUNKCE (Formuláře, Update, Delete) ---
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
    },

    async leaveReminder(reminder) {
        const remainingUsers = reminder.participants
            .map(p => p.username)
            .filter(u => u !== State.currentUser.username);

        const updateData = {
            title: reminder.title, description: reminder.description || "", color: reminder.color,
            allDay: reminder.allDay, time: reminder.reminderTime, date: reminder.reminderDate,
            usernames: remainingUsers
        };
        if (await Model.updateReminder(reminder.id, updateData)) {
            showToast("Opustili jste událost.", 'success');
            this.render();
        } else {
            showToast("Chyba při opouštění.", 'error');
        }
    },

    async deleteReminder() {
        const id = document.getElementById('reminderId').value;
        if (!id) return;
        
        const isShared = this.selectedUsernames.length > 0;
        if (isShared) {
             if (confirm("Toto je sdílená událost. Chcete ji OPUSTIT?")) {
                 // Sestavení objektu pro leaveReminder
                 const title = document.getElementById('reminderTitle').value;
                 const desc = document.getElementById('reminderDesc').value;
                 const date = document.getElementById('selectedDate').value;
                 const timeVal = document.getElementById('reminderTime').value;
                 const allDay = document.getElementById('reminderAllDay').checked;
                 const color = document.getElementById('selectedColor').value;
                 const time = (timeVal && !allDay) ? timeVal + ":00" : null;
                 const currentParticipants = [...this.selectedUsernames, State.currentUser.username].map(u => ({ username: u }));
                 
                 const dummyRem = { id, title, description: desc, reminderDate: date, reminderTime: time, allDay, color, participants: currentParticipants };
                 await this.leaveReminder(dummyRem);
                 this.closeModal();
             }
        } else {
            if (confirm("Opravdu smazat tuto událost?")) {
                if (await Model.deleteReminder(id)) {
                    showToast("Smazáno.", 'success');
                    this.closeModal();
                    this.render();
                } else {
                    showToast("Chyba při mazání.", 'error');
                }
            }
        }
    },

    toggleTimeInput() {
        const isAllDay = document.getElementById('reminderAllDay').checked;
        const timeInput = document.getElementById('reminderTime');
        if (isAllDay) {
            timeInput.value = '';
            timeInput.disabled = true;
            timeInput.style.opacity = '0.5';
        } else {
            timeInput.disabled = false;
            timeInput.style.opacity = '1';
        }
    },

    async moveReminder(reminder, newDate) {
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

    validateForm() {
        const titleInput = document.getElementById('reminderTitle');
        const saveBtn = document.getElementById('saveReminderBtn');
        if (!titleInput || !saveBtn) return;
        saveBtn.disabled = titleInput.value.trim() === "";
    },

    async openCreateModal(dateStr) {
        this.resetModal();
        document.getElementById('modalTitle').innerText = "Nová událost";
        document.getElementById('selectedDate').value = dateStr;
        document.getElementById('deleteBtn').style.display = 'none';
        
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

    async openEditModal(reminder, dateStr) {
        this.resetModal();
        document.getElementById('modalTitle').innerText = "Upravit událost";
        document.getElementById('reminderId').value = reminder.id;
        document.getElementById('reminderTitle').value = reminder.title;
        document.getElementById('reminderDesc').value = reminder.description || "";
        document.getElementById('selectedDate').value = dateStr;
        
        const deleteBtn = document.getElementById('deleteBtn');
        deleteBtn.style.display = 'block'; 
        const isShared = reminder.participants.length > 1;
        deleteBtn.innerText = isShared ? "Opustit událost" : "Smazat";

        const savedColor = reminder.color || '#007AFF'; 
        document.getElementById('selectedColor').value = savedColor;
        document.getElementById('customColorInput').value = savedColor;

        document.querySelectorAll('.color-circle').forEach(el => el.classList.remove('selected'));
        const matchingCircle = document.querySelector(`.color-circle[data-color="${savedColor}"]`);
        const labelSpan = document.getElementById('activeColorLabel');

        if (matchingCircle) {
            matchingCircle.classList.add('selected');
            if(labelSpan) labelSpan.innerText = matchingCircle.getAttribute('data-name');
        } else if(labelSpan) labelSpan.innerText = "Vlastní barva";

        document.getElementById('reminderAllDay').checked = reminder.allDay;
        const timeInput = document.getElementById('reminderTime');
        if (timeInput) timeInput.value = reminder.reminderTime ? reminder.reminderTime.substring(0, 5) : '';
        this.toggleTimeInput();

        const participants = reminder.participants.map(p => p.username).filter(n => n !== State.currentUser.username);
        await this.prepareUserList(participants);
        this.validateForm();
        this.showModal();
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

    async saveOrUpdate() {
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
                div.innerHTML = `<div class="user-checkbox"></div><span>${user.username}</span>`; // Zde je user.username, je to bezpečné (text v span)
                // Ale pro jistotu:
                const spanName = document.createElement('span');
                spanName.innerText = user.username;
                div.innerHTML = '';
                const cb = document.createElement('div'); cb.className = 'user-checkbox';
                div.appendChild(cb);
                div.appendChild(spanName);
                
                div.onclick = () => {
                    this.selectedUsernames.includes(user.username) ? 
                        this.selectedUsernames = this.selectedUsernames.filter(n => n !== user.username) : 
                        this.selectedUsernames.push(user.username);
                    this.renderUserList();
                };
                container.appendChild(div);
            });
    },

    filterUsers() { this.renderUserList(); }
};