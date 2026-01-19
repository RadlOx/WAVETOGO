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
const alertBtn = document.getElementById('alert');
const alertWidget = document.getElementById('booking-widget');
function prenota(idx) {
    if(selectedDaysGlobal[idx] === null) {
        alertBtn.style.display = 'block';
        alertWidget.style.boxShadow = '0 0 10px rgba(231, 77, 60, 0.34)';
        return;
    }
    alertBtn.style.display = 'none';
    alertWidget.style.border = 'none';
    alertWidget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
    
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
    function closeBookingPopup() {
        document.getElementById('booking-modal').style.display = 'none';
    }
    
summary.innerHTML = `
    <div id="booking-popup-container" style="font-family: 'Montserrat', sans-serif; color: #2d3436; max-width: 550px; margin: 20px auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.12); border: 1px solid #eee; position: relative; animation: fadeIn 0.3s ease-out;">
        
        <button onclick="closeModal()" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 35px; height: 35px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.4)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
            <i class="fas fa-times" style="font-size: 1.2rem;"></i>
        </button>

        <div style="background: linear-gradient(135deg, #1e3799 0%, #0984e3 100%); padding: 35px 20px; text-align: center; color: white;">
            <i class="fas fa-anchor" style="font-size: 2.2rem; margin-bottom: 10px;"></i>
            <h2 style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; font-size: 1.4rem;">Riepilogo Noleggio</h2>
        </div>

        <div style="padding: 25px;">
            
            <div style="display: flex; justify-content: space-between; background: #f8f9fa; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #edf2f7;">
                <div>
                    <span style="font-size: 0.7rem; color: #636e72; text-transform: uppercase; font-weight: 700;">Gommone</span>
                    <div style="font-weight: 700; color: #1e3799;">${boatName}</div>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.7rem; color: #636e72; text-transform: uppercase; font-weight: 700;">Orario</span>
                    <div style="font-weight: 700; color: #2d3436;">09:00 - 18:00</div>
                </div>
            </div>

            ${selectedExtras.length > 0 ? `
            <div style="margin-bottom: 15px; padding: 12px; background: #e3f2fd; border-radius: 12px; border: 1px solid #90caf9;">
                <p style="margin: 0 0 8px 0; font-size: 0.7rem; font-weight: 800; color: #1565c0; text-transform: uppercase;">Extra inclusi:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                    ${selectedExtras.map(extra => `
                        <span style="background: white; padding: 4px 8px; border-radius: 6px; font-size: 0.65rem; color: #2d3436; border: 1px solid #90caf9;">+ ${extra}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${missingExtras.length > 0 ? `
            <div style="margin-bottom: 20px; padding: 12px; background: #fff9db; border-radius: 12px; border: 1px dashed #f1c40f;">
                <p style="margin: 0 0 8px 0; font-size: 0.7rem; font-weight: 800; color: #856404; text-transform: uppercase;">Spesso aggiunti dai clienti:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                    ${missingExtras.slice(0, 3).map(extra => `
                        <span style="background: white; padding: 4px 8px; border-radius: 6px; font-size: 0.65rem; color: #2d3436; border: 1px solid #fcebb6;">+ ${extra}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
                <div style="background: #ebfbee; border: 1px solid #b7ebc6; padding: 15px; border-radius: 12px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.85rem; font-weight: 700; color: #276749;">ACCONTO DA PAGARE ORA</span>
                        <span style="font-size: 1.2rem; font-weight: 800; color: #276749;">€50,00</span>
                    </div>
                </div>

                <div style="background: #fff; border: 1px solid #edf2f7; padding: 15px; border-radius: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; font-weight: 600; color: #718096;">Saldo in loco (al molo)</span>
                        <span style="font-size: 1rem; font-weight: 700; color: #2d3436;">€${finalPrice - 50}</span>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.65rem; color: #a0aec0;">
                        <i class="fas fa-info-circle"></i> <b>Cauzione:</b> €400 con carta di credito (pre-autorizzazione restituita al rientro).
                    </div>
                </div>
            </div>

            <div style="background: #fff5f5; border: 1px solid #feb2b2; padding: 12px; border-radius: 12px; margin-bottom: 20px; font-size: 0.65rem; color: #c53030; line-height: 1.4;">
                <i class="fas fa-calendar-times"></i> <b>Politica di Cancellazione:</b><br>
                • Gratis fino a 7gg prima.<br>
                • Rimborso 25% dell'acconto entro 3gg.
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <input type="text" id="nome" placeholder="Nome e Cognome" style="width: 100%; padding: 14px; border: 2px solid #edf2f7; border-radius: 12px; outline: none; font-family: inherit; transition: 0.3s;" oninput="validateBooking()">
                <input type="tel" id="telefono" placeholder="WhatsApp / Telefono" style="width: 100%; padding: 14px; border: 2px solid #edf2f7; border-radius: 12px; outline: none; font-family: inherit; transition: 0.3s;" oninput="validateBooking()">

                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <input type="checkbox" id="check" style="margin-top: 3px; cursor: pointer;" onchange="validateBooking()">
                    <label for="check" style="font-size: 0.65rem; color: #718096; cursor: pointer; line-height: 1.4;">
                        Accetto i termini, la caparra di €50 e l'obbligo di saldo e cauzione (€400) in loco.
                    </label>
                </div>

                <button id="confirm-booking-btn" disabled 
                    style="margin-top: 5px; padding: 20px; border: none; border-radius: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: not-allowed; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: #dfe6e9; color: #b2bec3; font-size: 1rem;">
                    Paga Acconto €50
                </button>
            </div>
        </div>
    </div>
`;

function validateBooking() {
    const nome = document.getElementById('nome');
    const telefono = document.getElementById('telefono');
    const check = document.getElementById('check');
    const btn = document.getElementById('confirm-booking-btn');

    // Requisiti minimi: nome > 2, telefono > 6, checkbox true
    const isValid = nome.value.trim().length > 2 && 
                    telefono.value.trim().length > 6 && 
                    check.checked;

    if (isValid) {
        // --- STILE BOTTONE ATTIVO ---
        btn.disabled = false;
        btn.style.background = "linear-gradient(135deg, #0984e3 0%, #1e3799 100%)";
        btn.style.color = "#ffffff";
        btn.style.cursor = "pointer";
        btn.style.boxShadow = "0 10px 25px rgba(30, 55, 153, 0.4)";
        btn.style.transform = "scale(1.02)";
        btn.innerHTML = 'Procedi al Pagamento <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>';
        
        // Colore bordi input corretti
        nome.style.borderColor = "#b7ebc6";
        telefono.style.borderColor = "#b7ebc6";
    } else {
        // --- STILE BOTTONE DISABILITATO ---
        btn.disabled = true;
        btn.style.background = "#dfe6e9";
        btn.style.color = "#b2bec3";
        btn.style.cursor = "not-allowed";
        btn.style.boxShadow = "none";
        btn.style.transform = "scale(1)";
        btn.innerHTML = "Paga Acconto €50";
        
        // Reset bordi se vuoti
        nome.style.borderColor = nome.value.length > 0 ? "#edf2f7" : "#edf2f7";
    }
}


    const checkbox = document.getElementById('check');
    const bottone = document.getElementById('confirm-booking-btn');

    checkbox.addEventListener('change', function() {
     // Se la checkbox è selezionata, disabled diventa false
      bottone.disabled = !this.checked;
  });

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




