/**
 * CONFIGURAZIONE GENERALE
 * Modifica queste liste per cambiare i nomi dei mesi o dei giorni.
 */
const monthsNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const daysNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

/**
 * DATI PREZZI E STAGIONALITÀ
 * boatBasePrices: Prezzo base giornaliero per ogni barca (Barca 0, Barca 1, ecc.)
 * seasonMultipliers: Moltiplicatore basato sul mese (4 = Maggio: 1.0x, 7 = Agosto: 1.8x)
 */
const boatBasePrices = [150, 200, 130, 180, 250];
const seasonMultipliers = { 4: 1.0, 5: 1.2, 6: 1.5, 7: 1.8, 8: 1.2 };

/**
 * STATO GLOBALE
 * Memorizza le date correnti e le selezioni per ogni card (fino a 5 barche).
 */
let currentDates = Array(5).fill(null).map(() => new Date(2024, 4, 1)); // Inizia da Maggio 2024
let selectedDayElements = Array(5).fill(null); // Memorizza l'elemento HTML cliccato
let selectedDaysGlobal = Array(5).fill(null);  // Memorizza il numero del giorno scelto

// --- FUNZIONI DI INTERFACCIA (MENU E DETTAGLI) ---

/** Apre/Chiude il menu a tendina delle lingue */
function toggleLangMenu() { 
    const menu = document.getElementById("lang-menu");
    if(menu) menu.classList.toggle("show"); 
}

/** Cambia l'icona della bandiera e forza Twemoji a disegnarla */
function changeLanguage(langCode, flagEmoji) {
    const display = document.getElementById("current-lang");
    if (display) {
        display.innerHTML = flagEmoji;
        // Ridisegna l'emoji per evitare che Windows mostri solo testo
        if (typeof twemoji !== 'undefined') twemoji.parse(display, { folder: 'svg', ext: '.svg' });
    }
    toggleLangMenu(); // Chiude il menu
}

/** Mostra/Nasconde i dettagli della barca senza resettare gli extra scelti */
function toggleDetailsAndReset(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    if(!card) return;
    const ext = card.querySelector(".boat-details-extended");
    const arrow = card.querySelector(".arrow-toggle");
    if(ext && arrow) {
        ext.classList.toggle("open"); // Apre/chiude il pannello
        arrow.classList.toggle("rotate-icon"); // Ruota la freccetta
    }
}

/** Deseleziona tutti i servizi extra per una specifica barca */
function resetExtrasOnly(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    if(!card) return;
    card.querySelectorAll('.extra-checkbox').forEach(cb => cb.checked = false);
    calculateTotalWithExtras(idx); // Aggiorna il prezzo totale
}

// --- LOGICA DI CALCOLO E CALENDARIO ---

/** Calcola il prezzo finale: (Prezzo Base x Moltiplicatore Mese) + Servizi Extra */
function calculateTotalWithExtras(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    if(!card) return;
    const msgEl = card.querySelector('.selected-date-msg');
    
    // Se non ha ancora scelto un giorno, non calcolare
    if (selectedDaysGlobal[idx] === null) {
        msgEl.innerText = "Seleziona una data per vedere disponibilità";
        return;
    }

    const monthIndex = currentDates[idx].getMonth();
    const base = boatBasePrices[idx];
    const mult = seasonMultipliers[monthIndex] || 1;
    const dailyPrice = Math.round(base * mult); // Prezzo della giornata
    
    // Somma i prezzi di tutte le checkbox spuntate
    let extrasTotal = 0;
    card.querySelectorAll('.extra-checkbox:checked').forEach(cb => { 
        extrasTotal += parseInt(cb.getAttribute('data-price')); 
    });
    
    const finalTotal = dailyPrice + extrasTotal;
    msgEl.innerHTML = `Scelto: ${selectedDaysGlobal[idx]} ${monthsNames[monthIndex]} - Prezzo totale: <b>€${finalTotal}</b>`;
}

/** Disegna il calendario nell'HTML per il mese corrente della barca specificata */
function renderCalendar(idx) {
    const card = document.querySelectorAll('.boat-card')[idx];
    if(!card) return;
    
    const date = currentDates[idx];
    const month = date.getMonth();
    const year = date.getFullYear();
    const container = card.querySelector('.calendar-grid');
    
    // Aggiorna intestazione Mese Anno
    card.querySelector('.month-year-display').innerText = `${monthsNames[month]} ${year}`;
    
    // Controlla se il mese è prenotabile (Maggio-Settembre)
    const isSelectableMonth = month >= 4 && month <= 8;
    const base = boatBasePrices[idx];
    const mult = seasonMultipliers[month] || 0;
    const currentPrice = isSelectableMonth ? Math.round(base * mult) : "---";
    card.querySelector('.price-display').innerText = isSelectableMonth ? `€${currentPrice}` : "---";

    container.innerHTML = ""; // Svuota il calendario vecchio

    // Logica per i giorni vuoti all'inizio (allineamento Lunedì)
    const firstDay = new Date(year, month, 1).getDay();
    const emptySlots = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < emptySlots; i++) { 
        container.appendChild(Object.assign(document.createElement('div'), {className: 'day-item empty'})); 
    }

    // Riempimento giorni del mese
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.innerText = day;
        dayDiv.className = 'day-item';
        
        if (selectedDaysGlobal[idx] === day) dayDiv.classList.add('selected');

        if (isSelectableMonth) {
            dayDiv.onclick = () => {
                // Rimuove la selezione dal giorno precedente e la mette sul nuovo
                if (selectedDayElements[idx]) selectedDayElements[idx].classList.remove('selected');
                dayDiv.classList.add('selected');
                selectedDayElements[idx] = dayDiv;
                selectedDaysGlobal[idx] = day;
                calculateTotalWithExtras(idx);
            };
        } else { 
            dayDiv.classList.add('disabled'); // Mese fuori stagione
        }
        container.appendChild(dayDiv);
    }
}

/** Navigazione avanti/indietro tra i mesi */
function changeMonth(step, idx) {
    currentDates[idx].setMonth(currentDates[idx].getMonth() + step);
    selectedDayElements[idx] = null; // Resetta selezione grafica
    selectedDaysGlobal[idx] = null;  // Resetta giorno scelto
    renderCalendar(idx);             // Ridisegna
    calculateTotalWithExtras(idx);   // Resetta messaggio prezzo
}

// --- LOGICA PRENOTAZIONE (WHATSAPP) ---

/** Prepara i dati e apre la chat di WhatsApp con il riepilogo */
function prenota(idx) {
    if(selectedDaysGlobal[idx] === null) {
        alert("Per favore seleziona un giorno valido prima di prenotare.");
        return;
    }
    
    const card = document.querySelectorAll('.boat-card')[idx];
    const boatName = card.querySelector('h3').innerText;
    const month = currentDates[idx].getMonth();
    
    // Recupera nomi degli extra scelti
    let selectedExtras = [];
    let extrasTotal = 0;
    card.querySelectorAll('.extra-checkbox:checked').forEach(cb => { 
        extrasTotal += parseInt(cb.getAttribute('data-price'));
        selectedExtras.push(cb.getAttribute('data-name'));
    });
    
    // Calcolo prezzo finale per il messaggio
    const dailyPrice = Math.round(boatBasePrices[idx] * (seasonMultipliers[month] || 1));
    const finalPrice = dailyPrice + extrasTotal;
    const dateStr = `${selectedDaysGlobal[idx]} ${monthsNames[month]} 2024`;
    const extrasStr = selectedExtras.length > 0 ? `%0AExtra scelti: ${selectedExtras.join(', ')}` : "";
    
    // Creazione URL WhatsApp
    const message = `*RICHIESTA PRENOTAZIONE*%0A%0A*Barca:* ${boatName}%0A*Giorno:* ${dateStr}%0A*Totale:* €${finalPrice}${extrasStr}`;
    window.open(`https://wa.me/393336495188?text=${message}`, '_blank');
}

// --- GESTIONE AVVIO E COMPATIBILITÀ ---

/** Esegue Twemoji per trasformare le bandiere in icone grafiche */
function forceTwemoji() {
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
    }
}

/** Inizializzazione al caricamento della pagina */
window.onload = () => {
    // 1. Disegna i calendari per tutte le card barca presenti
    document.querySelectorAll('.boat-card').forEach((_, i) => renderCalendar(i));
    
    // 2. Forza le bandiere (ripetuto per sicurezza sui caricamenti lenti di Windows)
    forceTwemoji();
    setTimeout(forceTwemoji, 500); 
    setTimeout(forceTwemoji, 1500); 
};

/** Chiude il menu lingue se si clicca in un punto qualsiasi fuori dal selettore */
window.addEventListener('click', (e) => { 
    if (!e.target.closest('.lang-selector')) { 
        const menu = document.getElementById("lang-menu");
        if (menu) menu.classList.remove("show"); 
    } 
});