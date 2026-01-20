/**
 * 1. CONFIGURAZIONE TWEMOJI
 * Gestisce il rendering uniforme delle bandiere su tutti i sistemi operativi
 */
window.forceTwemoji = function(element) {
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(element, {
            folder: 'svg',
            ext: '.svg'
        });
    } else {
        console.warn("Libreria Twemoji non caricata.");
    }
};

/**
 * 2. INIZIALIZZAZIONE AL CARICAMENTO DEL DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // Navigazione Pagine
    const pages = {
        home: document.getElementById('page0'),
        flotta: document.getElementById('page1'),
        itinerario: document.getElementById('page2')
    };
    
    const buttons = {
        home: document.getElementById('one-button'),
        flotta: document.getElementById('two-button'),
        itinerario: document.getElementById('three-button')
    };

    // Funzione Unificata di Navigazione
    window.switchPage = function(activeKey) {
        // Reset visibilità pagine
        Object.values(pages).forEach(p => { if(p) p.style.display = 'none'; });
        // Reset icone navigation bar
        Object.values(buttons).forEach(b => { 
            if(b) {
                const icon = b.querySelector('i');
                if(icon) icon.style.color = "";
            }
        });

        // Attiva pagina richiesta
        if (pages[activeKey]) pages[activeKey].style.display = 'block';
        if (buttons[activeKey]) {
            const icon = buttons[activeKey].querySelector('i');
            if(icon) icon.style.color = "var(--accent-orange)";
        }
        
        window.scrollTo(0, 0);
    };

    // Event Listeners Navigazione
    if(buttons.home) buttons.home.addEventListener('click', () => switchPage('home'));
    if(buttons.flotta) buttons.flotta.addEventListener('click', () => switchPage('flotta'));
    if(buttons.itinerario) buttons.itinerario.addEventListener('click', () => switchPage('itinerario'));

    // Inizializzazione Calendari per ogni barca
    document.querySelectorAll(".boat-card").forEach((_, i) => {
        if (typeof renderCalendar === "function") renderCalendar(i);
    });
    
    // Parsing Emoji Iniziale
    if (typeof twemoji !== "undefined") {
        twemoji.parse(document.body, { folder: "svg", ext: ".svg" });
    }

    // Scroll Effect per la Bottom Nav
    const bottomNav = document.querySelector('.bottom-nav');
    const handleScrollLogic = (e) => {
        const target = e.target === document ? document.documentElement : e.target;
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight - target.clientHeight;
        const percentage = (scrollTop / scrollHeight) * 100;

        if (percentage >= 20) {
            bottomNav?.classList.add('scrolled');
        } else {
            bottomNav?.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScrollLogic);
    ['page0', 'page1', 'page2'].forEach(id => {
        document.getElementById(id)?.addEventListener('scroll', handleScrollLogic);
    });

    // Stato Iniziale
    switchPage('home');
});

/**
 * 3. LOGICA TAB INTERNI (DOTAZIONI / EXTRA)
 */
window.toggleBoatTab = function(event, tabId) {
    const container = event.currentTarget.closest('.elite-edition');
    
    // Switch Bottoni
    container.querySelectorAll('.p-tab').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Switch Pannelli
    container.querySelectorAll('.p-tab-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    const activePanel = document.getElementById(tabId);
    if (activePanel) {
        activePanel.classList.add('active');
        activePanel.style.display = 'block';
    }
};

/**
 * 4. CALCOLO DINAMICO PREZZI EXTRA
 */
window.calculateTotalWithExtras = function(index) {
    const boatCards = document.querySelectorAll('.boat-card');
    const card = boatCards[index];
    if (!card) return;

    const basePrice = parseFloat(card.querySelector('.base-price-value')?.innerText) || 0;
    let extrasTotal = 0;

    card.querySelectorAll(".extra-checkbox:checked").forEach(cb => {
        extrasTotal += parseInt(cb.dataset.price || 0);
    });

    const totalDisplay = card.querySelector('.total-price-display');
    if (totalDisplay) {
        totalDisplay.innerText = basePrice + extrasTotal;
    }
};

/**
 * 5. LOGICA PRENOTAZIONE E MODALE
 */
function prenota(idx) {
    // Controllo se il giorno è selezionato
    if (!STATE.selectedDays[idx]) {
        const alertbtn = document.getElementById("alert");
        const alertWidget = document.getElementById("booking-widget");
        if(alertbtn) alertbtn.style.display = "block";
        if(alertWidget) alertWidget.style.boxShadow = "0 0 10px rgba(207, 25, 25, 0.4)";
        return;
    }

    const card = document.querySelectorAll('.boat-card')[idx];
    const monthIndex = STATE.dates[idx].getMonth();
    
    // Calcolo Totale per il Riepilogo
    const basePrice = Math.round(CONFIG.basePrices[idx] * (CONFIG.multipliers[monthIndex] || 1));
    const selectedExtrasNames = [];
    let extrasTotal = 0;

    card.querySelectorAll(".extra-checkbox:checked").forEach(cb => {
        extrasTotal += parseInt(cb.dataset.price || 0);
        selectedExtrasNames.push(cb.dataset.name || "Extra");
    });

    // Salvataggio dati nello Stato
    STATE.currentBookingData = {
        boatName: card.querySelector("h3")?.innerText || "Barca",
        dateStr: `${STATE.selectedDays[idx]} ${CONFIG.months[monthIndex]} 2024`,
        finalPrice: basePrice + extrasTotal,
        selectedExtras: selectedExtrasNames
    };

    // Rendering template checkout
    const summaryContainer = document.getElementById("modal-summary");
    if (summaryContainer && typeof getCheckoutTemplate === "function") {
        summaryContainer.innerHTML = getCheckoutTemplate({
            ...STATE.currentBookingData,
            missingExtras: CONFIG.allExtras.filter(ex => !selectedExtrasNames.includes(ex))
        });
    }

    // Attivazione Listeners Modale
    setupBookingListeners();
    
    // Apertura Modale
    const modal = document.getElementById("booking-modal");
    if (modal) modal.style.display = "flex";
}

/**
 * 6. VALIDAZIONE FORM E INVIO WHATSAPP
 */
function setupBookingListeners() {
    const fields = {
        nome: document.getElementById("nome"),
        tel: document.getElementById("telefono"),
        check: document.getElementById("check"),
        btn: document.getElementById("confirm-booking-btn")
    };

    if (!fields.btn) return;

    const validate = () => {
        const isValid = fields.nome.value.trim().length > 2 && 
                        fields.tel.value.trim().length > 6 && 
                        fields.check.checked;

        fields.btn.disabled = !isValid;
        
        // Cambio classe per feedback visivo (colore)
        if (isValid) {
            fields.btn.classList.remove("disabled-booking");
            fields.btn.classList.add("active-booking");
        } else {
            fields.btn.classList.remove("active-booking");
            fields.btn.classList.add("disabled-booking");
        }
    };

    // Eventi di input
    fields.nome?.addEventListener('input', validate);
    fields.tel?.addEventListener('input', validate);
    fields.check?.addEventListener('change', validate);

    // Esegui subito per stato iniziale
    validate();

    // Azione finale: WhatsApp
    fields.btn.onclick = () => {
        const d = STATE.currentBookingData;
        const msg = `*RICHIESTA PRENOTAZIONE*%0A%0A` +
                    `*Cliente:* ${fields.nome.value}%0A` +
                    `*Barca:* ${d.boatName}%0A` +
                    `*Giorno:* ${d.dateStr}%0A` +
                    `*Totale:* €${d.finalPrice}` +
                    `${d.selectedExtras.length ? '%0A*Extra:* ' + d.selectedExtras.join(", ") : ""}`;
        
        window.open(`https://wa.me/393336495188?text=${msg}`, "_blank");
    };
}

function closeModal() {
    const modal = document.getElementById("booking-modal");
    if (modal) modal.style.display = "none";
}

/**
 * 7. GESTIONE LINGUA
 */
function changeLanguage(langCode, flagEmoji) {
    const display = document.getElementById("current-lang");
    if (display) {
        display.innerHTML = flagEmoji;
        if (window.forceTwemoji) window.forceTwemoji(display);
    }
    document.getElementById("lang-menu")?.classList.remove("show");
    // Qui puoi aggiungere la logica per tradurre i testi del sito
}