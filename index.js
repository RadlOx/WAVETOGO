document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementi UI e Stato
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

    // 2. Funzione Unificata di Navigazione
    function switchPage(activeKey) {
        // Reset totale
        Object.values(pages).forEach(p => p.style.display = 'none');
        Object.values(buttons).forEach(b => b.querySelector('i').style.color = "");

        // Attiva pagina richiesta
        pages[activeKey].style.display = 'block';
        buttons[activeKey].querySelector('i').style.color = "var(--accent-orange)";
        
        window.scrollTo(0, 0);
    }

    // 3. Event Listeners
    buttons.home.addEventListener('click', () => switchPage('home'));
    buttons.flotta.addEventListener('click', () => switchPage('flotta'));
    buttons.itinerario.addEventListener('click', () => switchPage('itinerario'));

    // 4. Inizializzazione Calendari e Stato Iniziale
    document.querySelectorAll(".boat-card").forEach((_, i) => renderCalendar(i));
    
    if (typeof twemoji !== "undefined") {
        twemoji.parse(document.body, { folder: "svg", ext: ".svg" });
    }

    // Forza Home attiva all'avvio
    switchPage('home');
});

/** * LOGICA PRENOTAZIONE OTTIMIZZATA
 */
function prenota(idx) {
    if (STATE.selectedDays[idx] === null) {
        document.getElementById("alert")?.setAttribute("style", "display:block");
        return;
    }

    const card = getCard(idx);
    const month = STATE.dates[idx].getMonth();
    
    // Calcolo dinamico
    const basePrice = Math.round(CONFIG.basePrices[idx] * (CONFIG.multipliers[month] || 1));
    const selectedExtras = [];
    let extrasTotal = 0;

    card.querySelectorAll(".extra-checkbox:checked").forEach(cb => {
        extrasTotal += parseInt(cb.dataset.price);
        selectedExtras.push(cb.dataset.name);
    });

    STATE.currentBookingData = {
        boatName: card.querySelector("h3").innerText,
        dateStr: `${STATE.selectedDays[idx]} ${CONFIG.months[month]} 2024`,
        finalPrice: basePrice + extrasTotal,
        selectedExtras
    };

    // Iniezione e apertura modale
    document.getElementById("modal-summary").innerHTML = getCheckoutTemplate({
        ...STATE.currentBookingData,
        missingExtras: CONFIG.allExtras.filter(ex => !selectedExtras.includes(ex))
    });

    setupBookingListeners();
    document.getElementById("booking-modal").style.display = "flex";
}

function setupBookingListeners() {
    const fields = {
        nome: document.getElementById("nome"),
        tel: document.getElementById("telefono"),
        check: document.getElementById("check"),
        btn: document.getElementById("confirm-booking-btn")
    };

    const validate = () => {
        const isValid = fields.nome.value.trim().length > 2 && 
                        fields.tel.value.trim().length > 6 && 
                        fields.check.checked;

        fields.btn.disabled = !isValid;
        fields.btn.className = isValid ? "main-btn active-booking" : "main-btn disabled-booking"; 
        // Nota: usa le classi CSS per lo stile invece di iniettare mille righe di style JS
    };

    [fields.nome, fields.tel].forEach(f => f.oninput = validate);
    fields.check.onchange = validate;

    fields.btn.onclick = () => {
        const d = STATE.currentBookingData;
        const msg = `*RICHIESTA PRENOTAZIONE*%0A%0A*Cliente:* ${fields.nome.value}%0A*Barca:* ${d.boatName}%0A*Giorno:* ${d.dateStr}%0A*Totale:* €${d.finalPrice}${d.selectedExtras.length ? '%0A*Extra:* ' + d.selectedExtras.join(", ") : ""}`;
        window.open(`https://wa.me/393336495188?text=${msg}`, "_blank");
    };
}

function closeModal() {
    document.getElementById("booking-modal").style.display = "none";
}