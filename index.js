// --- CONFIGURAZIONE FISSA (Solo Italiano) ---
const monthsNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const daysNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// --- FUNZIONI INTERFACCIA ---
function toggleLangMenu() { 
    // Mantenuta per compatibilità HTML se presente il bottone, ma svuotata della logica lingue
    const menu = document.getElementById("lang-menu");
    if(menu) menu.classList.toggle("show"); 
}

function toggleDetailsAndReset(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    const ext = card.querySelector(".boat-details-extended");
    const arrow = card.querySelector(".arrow-toggle");
    ext.classList.toggle("open");
    arrow.classList.toggle("rotate-icon");
    resetExtrasOnly(idx);
}

function resetExtrasOnly(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    card.querySelectorAll('.extra-checkbox').forEach(cb => { cb.checked = false; });
    calculateTotalWithExtras(idx);
}

function setActive(el) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
}

// --- LOGICA CALENDARIO E PREZZI ---
const boatBasePrices = [150, 200, 130, 180, 250];
const seasonMultipliers = { 4: 1.0, 5: 1.2, 6: 1.5, 7: 1.8, 8: 1.2 };

let currentDates = [new Date(2024, 4, 1), new Date(2024, 4, 1), new Date(2024, 4, 1), new Date(2024, 4, 1), new Date(2024, 4, 1)];
let selectedDayElements = [null, null, null, null, null];
let selectedDaysGlobal = [null, null, null, null, null];

function calculateTotalWithExtras(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
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
    const monthIndex = currentDates[idx].getMonth();
    const year = currentDates[idx].getFullYear();
    const container = card.querySelector('.calendar-grid');
    
    // Aggiorna Mese/Anno
    card.querySelector('.month-year-display').innerText = `${monthsNames[monthIndex]} ${year}`;
    
    // Traduzione Giorni fisso in Italiano
    const weekdaysContainer = card.querySelector(".weekdays-container") || card.querySelector(".calendar-weekdays");
    if(weekdaysContainer) {
        weekdaysContainer.innerHTML = daysNames.map(d => `<div>${d}</div>`).join('');
    }

    // Gestione Prezzi Stagionali
    const isSelectableMonth = monthIndex >= 4 && monthIndex <= 8;
    const base = boatBasePrices[idx];
    const mult = seasonMultipliers[monthIndex] || 0;
    const currentPrice = isSelectableMonth ? Math.round(base * mult) : "---";
    card.querySelector('.price-display').innerText = isSelectableMonth ? `€${currentPrice}` : "---";

    container.innerHTML = "";
    const firstDayIndex = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < adjustedFirstDay; i++) { 
        container.appendChild(Object.assign(document.createElement('div'), {className: 'day-item empty'})); 
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.innerText = day;
        dayDiv.classList.add('day-item');
        
        if (selectedDaysGlobal[idx] === day) dayDiv.classList.add('selected');

        if (isSelectableMonth) {
            dayDiv.onclick = () => {
                if (selectedDayElements[idx]) selectedDayElements[idx].classList.remove('selected');
                dayDiv.classList.add('selected');
                selectedDayElements[idx] = dayDiv;
                selectedDaysGlobal[idx] = day;
                calculateTotalWithExtras(idx);
            };
        } else { dayDiv.classList.add('disabled'); }
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

function prenota(idx) {
    if(selectedDaysGlobal[idx] === null) {
        alert("Per favore seleziona un giorno valido tra Maggio e Settembre.");
        return;
    }
    
    const card = document.querySelectorAll('.boat-card')[idx];
    const boatName = card.querySelector('h3').innerText;
    const monthIndex = currentDates[idx].getMonth();
    const base = boatBasePrices[idx];
    const mult = seasonMultipliers[monthIndex] || 1;
    const dailyPrice = Math.round(base * mult);
    
    let selectedExtras = [];
    let extrasTotal = 0;
    card.querySelectorAll('.extra-checkbox:checked').forEach(cb => { 
        extrasTotal += parseInt(cb.getAttribute('data-price'));
        selectedExtras.push(cb.getAttribute('data-name'));
    });
    
    const finalPrice = dailyPrice + extrasTotal;
    const dateStr = `${selectedDaysGlobal[idx]} ${monthsNames[monthIndex]} 2024`;
    const extrasStr = selectedExtras.length > 0 ? `%0AExtras: ${selectedExtras.join(', ')}` : "";
    
    const message = `Ciao WaveToGo! Vorrei prenotare il ${boatName} per il giorno ${dateStr}.%0APrezzo Totale: €${finalPrice}${extrasStr}`;
    const whatsappUrl = `https://wa.me/393246830501?text=${message}`;
    
    alert("Reindirizzamento a WhatsApp per confermare...");
    window.open(whatsappUrl, '_blank');
}

// Gestione chiusura menu
window.onclick = (e) => { 
    if (document.getElementById("lang-menu") && !e.target.closest('.lang-selector')) { 
        document.getElementById("lang-menu").classList.remove("show"); 
    } 
};

// Inizializzazione
for(let i=0; i<5; i++) { renderCalendar(i); }
twemoji.parse(document.body);   