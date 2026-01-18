/**
 * CONFIGURAZIONE GENERALE
 */
const monthsNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const daysNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const boatBasePrices = [150, 200, 130, 180, 250];
const seasonMultipliers = { 4: 1.0, 5: 1.2, 6: 1.5, 7: 1.8, 8: 1.2 };

let currentDates = Array(5).fill(null).map(() => new Date(2024, 4, 1));
let selectedDayElements = Array(5).fill(null);
let selectedDaysGlobal = Array(5).fill(null);


// --- FUNZIONI INTERFACCIA ESISTENTI ---

function toggleLangMenu() { 
    const menu = document.getElementById("lang-menu");
    if(menu) menu.classList.toggle("show"); 
}

function changeLanguage(langCode, flagEmoji) {
    const display = document.getElementById("current-lang");
    if (display) {
        display.innerHTML = flagEmoji;
        if (typeof twemoji !== 'undefined') twemoji.parse(display, { folder: 'svg', ext: '.svg' });
    }
    const menu = document.getElementById("lang-menu");
    if (menu) menu.classList.remove("show");
}

function toggleDetailsAndReset(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    if(!card) return;
    const ext = card.querySelector(".boat-details-extended");
    const arrow = card.querySelector(".arrow-toggle");
    if(ext && arrow) {
        ext.classList.toggle("open");
        arrow.classList.toggle("rotate-icon");
    }
}

function resetExtrasOnly(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    if(!card) return;
    card.querySelectorAll('.extra-checkbox').forEach(cb => cb.checked = false);
    calculateTotalWithExtras(idx);
}

// --- LOGICA CALENDARIO ---

function calculateTotalWithExtras(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    if(!card) return;
    const msgEl = card.querySelector('.selected-date-msg');
    
    if (selectedDaysGlobal[idx] === null) {
        msgEl.innerText = "Seleziona una data per vedere disponibilità";
        return;
    }

    const monthIndex = currentDates[idx].getMonth();
    const base = boatBasePrices[idx];
    const mult = seasonMultipliers[monthIndex] || 1;
    const dailyPrice = Math.round(base * mult);
    
    let extrasTotal = 0;
    card.querySelectorAll('.extra-checkbox:checked').forEach(cb => { 
        extrasTotal += parseInt(cb.getAttribute('data-price')); 
    });
    
    const finalTotal = dailyPrice + extrasTotal;
    msgEl.innerHTML = `Scelto: ${selectedDaysGlobal[idx]} ${monthsNames[monthIndex]} - Prezzo totale: <b>€${finalTotal}</b>`;
}

function renderCalendar(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    if(!card) return;
    const month = currentDates[idx].getMonth();
    const year = currentDates[idx].getFullYear();
    const container = card.querySelector('.calendar-grid');
    
    card.querySelector('.month-year-display').innerText = `${monthsNames[month]} ${year}`;
    
    const isSelectableMonth = month >= 4 && month <= 8;
    const currentPrice = isSelectableMonth ? Math.round(boatBasePrices[idx] * (seasonMultipliers[month] || 0)) : "---";
    card.querySelector('.price-display').innerText = isSelectableMonth ? `€${currentPrice}` : "---";

    container.innerHTML = "";
    const firstDay = new Date(year, month, 1).getDay();
    const emptySlots = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < emptySlots; i++) { 
        container.appendChild(Object.assign(document.createElement('div'), {className: 'day-item empty'})); 
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.innerText = day;
        dayDiv.className = 'day-item';
        if (selectedDaysGlobal[idx] === day) dayDiv.classList.add('selected');

        if (isSelectableMonth) {
            dayDiv.onclick = () => {
                if (selectedDayElements[idx]) selectedDayElements[idx].classList.remove('selected');
                dayDiv.classList.add('selected');
                selectedDayElements[idx] = dayDiv;
                selectedDaysGlobal[idx] = day;
                calculateTotalWithExtras(idx);
            };
        } else { 
            dayDiv.classList.add('disabled');
        }
        container.appendChild(dayDiv);
    }
}

function changeMonth(step, idx) {
    currentDates[idx].setMonth(currentDates[idx].getMonth() + step);
    selectedDayElements[idx] = null;
    selectedDaysGlobal[idx] = null;
    renderCalendar(idx);
    calculateTotalWithExtras(idx);
}

// --- MODIFICA PRENOTA CON POPUP ---

function prenota(idx) {
    if(selectedDaysGlobal[idx] === null) {
        alert("Per favore seleziona un giorno valido.");
        return;
    }
    const card = document.querySelectorAll('.boat-card')[idx];
    const boatName = card.querySelector('h3').innerText;
    const month = currentDates[idx].getMonth();
    
    let selectedExtras = [];
    let extrasTotal = 0;
    card.querySelectorAll('.extra-checkbox:checked').forEach(cb => { 
        extrasTotal += parseInt(cb.getAttribute('data-price'));
        selectedExtras.push(cb.getAttribute('data-name'));
    });
    
    const finalPrice = Math.round(boatBasePrices[idx] * (seasonMultipliers[month] || 1)) + extrasTotal;
    const dateStr = `${selectedDaysGlobal[idx]} ${monthsNames[month]} 2024`;
    
    // Mostriamo il popup
    const summary = document.getElementById('modal-summary');
    summary.innerHTML = `
        <p><b>Modello:</b> ${boatName}</p>
        <p><b>Giorno:</b> ${dateStr}</p>
        <p><b>Extra:</b> ${selectedExtras.length > 0 ? selectedExtras.join(', ') : 'Nessuno'}</p>
        <div style="font-size: 1.3rem; margin-top: 20px; color: #1a2a6c;"><b>TOTALE: €${finalPrice}</b></div>
    `;

    document.getElementById('confirm-booking-btn').onclick = () => {
        const extrasStr = selectedExtras.length > 0 ? `%0AExtra scelti: ${selectedExtras.join(', ')}` : "";
        const message = `*RICHIESTA PRENOTAZIONE*%0A%0A*Barca:* ${boatName}%0A*Giorno:* ${dateStr}%0A*Totale:* €${finalPrice}${extrasStr}`;
        window.open(`https://wa.me/393336495188?text=${message}`, '_blank');
        closeModal();
    };

    document.getElementById('booking-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('booking-modal').style.display = 'none';
}

// --- AVVIO ---

function forceTwemoji() {
    if (typeof twemoji !== 'undefined') twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
}

window.onload = () => {
    document.querySelectorAll('.boat-card').forEach((_, i) => renderCalendar(i));
    forceTwemoji();
};

window.addEventListener('click', (e) => { 
    if (!e.target.closest('.lang-selector')) { 
        const menu = document.getElementById("lang-menu");
        if (menu) menu.classList.remove("show"); 
    } 
    // Chiudi popup se clicchi fuori dalla parte bianca
    const modal = document.getElementById('booking-modal');
    if (e.target === modal) closeModal();
});