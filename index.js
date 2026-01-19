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


/**
 * Versione specifica per strutture con scroll interno
 */
const mainContainer = document.querySelector('.main-content');
const bottomNav = document.querySelector('.bottom-nav');

if (mainContainer && bottomNav) {
    mainContainer.addEventListener('scroll', function() {
        // Calcola quanto hai scrollato dentro il div
        const scrollTop = mainContainer.scrollTop;
        const scrollHeight = mainContainer.scrollHeight - mainContainer.clientHeight;
        const percentage = (scrollTop / scrollHeight) * 100;

        // Recupera l'elemento attivo corrente
        const activeItem = bottomNav.querySelector('.nav-item.active');

        // Soglia al 20%
        if (percentage > 20) {
            bottomNav.style.setProperty('background-color', 'var(--primary-dark)', 'important');
            bottomNav.style.setProperty('color', 'var(--white)', 'important');
            bottomNav.style.backdropFilter = "blur(10px)"; // Effetto moderno
            bottomNav.style.transition = "all 0.4s ease";
            
            // Applica colore bianco all'elemento attivo per contrasto sul blu scuro
            if (activeItem) {
                activeItem.style.setProperty('color', '#ffffff', 'important');
            }
        } else {
            bottomNav.style.setProperty('background-color', 'rgba(255, 255, 255, 0.95)', 'important');
            bottomNav.style.backdropFilter = "none";
            
            // Ripristina il colore originale all'elemento attivo
            if (activeItem) {
                activeItem.style.setProperty('color', 'var(--primary-dark)', 'important');
            }
        }
    });
}

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
// Recuperiamo gli extra non selezionati per il promemoria
const allPossibleExtras = ["Ghiacciaia","Telo e crema solare", "Kit snorkeling", "Giochi gonfiabili", "Set GoPro", "Benzina"];
const missingExtras = allPossibleExtras.filter(item => !selectedExtras.includes(item));

summary.innerHTML = `
    <div style="font-family: 'Montserrat', sans-serif; color: #2d3436;">
        <div style="text-align: center; margin-bottom: 20px;">
            <i class="fas fa-file-invoice" style="font-size: 2rem; color: #1a2a6c;"></i>
            <h3 style="margin: 10px 0; color: #1a2a6c; text-transform: uppercase; letter-spacing: 1px;">Riepilogo Ordine</h3>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; color: #636e72; font-weight: 500;">Modello Barca</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #1a2a6c;">${boatName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; color: #636e72; font-weight: 500;">Data Selezionata</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700;">${dateStr}</td>
            </tr>
        </table>

        <div style="margin-bottom: 20px;">
            <p style="font-size: 0.85rem; font-weight: 700; color: #b21f1f; text-transform: uppercase; margin-bottom: 10px;">Servizi Inclusi:</p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${selectedExtras.length > 0 
                    ? selectedExtras.map(ex => `<span style="background: #e1f5fe; color: #0288d1; padding: 5px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: 600;">+ ${ex}</span>`).join('')
                    : '<span style="color: #95a5a6; font-style: italic;">Nessun extra selezionato</span>'}
            </div>
        </div>

        <hr style="border: 0; height: 1px; background: linear-gradient(to right, transparent, #ddd, transparent); margin: 25px 0;">

        ${missingExtras.length > 0 ? `
            <div style="background: #fff9db; padding: 15px; border-radius: 12px; border: 1px dashed #f1c40f; margin-bottom: 25px;">
                <p style="margin: 0 0 8px 0; font-size: 0.8rem; font-weight: 700; color: #856404;">
                    <i class="fas fa-lightbulb"></i> TI SERVE ALTRO?
                </p>
                <p style="margin: 0; font-size: 0.75rem; color: #927420;">
                    Puoi ancora aggiungere: <b>${missingExtras.slice(0, 5).join(', ')}...</b> comunicandolo in chat!
                </p>
            </div>
        ` : ''}

        <div style="background: #1a2a6c; color: white; padding: 20px; border-radius: 15px; text-align: center; box-shadow: 0 4px 15px rgba(26, 42, 108, 0.3);">
            <span style="font-size: 0.9rem; opacity: 0.8; text-transform: uppercase;">Totale da corrispondere</span>
            <div style="font-size: 2.2rem; font-weight: 800; margin-top: 5px;">€${finalPrice}</div>
            <div style="font-size: 0.7rem; margin-top: 10px; opacity: 0.7;">Tasse e costi di servizio inclusi</div>
        </div>
    </div>
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




