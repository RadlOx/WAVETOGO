/**
 * 2. GESTIONE UI NAVIGAZIONE (SCROLL)
 */
const uiElements = {
  mainContainer: document.querySelector(".main-content"),
  bottomNav: document.querySelector(".bottom-nav"),
};

if (uiElements.mainContainer && uiElements.bottomNav) {
  uiElements.mainContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = uiElements.mainContainer;
    const percentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
    const activeItem = uiElements.bottomNav.querySelector(".nav-item.active");
    const isScrolled = percentage > 20;

    // Ottimizzazione stili tramite classi o proprietà dirette
    Object.assign(uiElements.bottomNav.style, {
      backgroundColor: isScrolled
        ? "var(--primary-dark)"
        : "rgba(255, 255, 255, 0.95)",
      color: isScrolled ? "var(--white)" : "var(--primary-dark)",
      backdropFilter: isScrolled ? "blur(10px)" : "none",
      transition: "all 0.4s ease",
    });

    if (activeItem) {
      activeItem.style.setProperty(
        "color",
        isScrolled ? "#ffffff" : "var(--primary-dark)",
        "important",
      );
    }
  });
}

/**
 * 3. FUNZIONI INTERFACCIA UTENTE
 */
function toggleLangMenu() {
  document.getElementById("lang-menu")?.classList.toggle("show");
}

function changeLanguage(langCode, flagEmoji) {
  const display = document.getElementById("current-lang");
  if (display) {
    display.innerHTML = flagEmoji;
    forceTwemoji(display);
  }
  document.getElementById("lang-menu")?.classList.remove("show");
}

function toggleDetailsAndReset(idx) {
  const card = getCard(idx);
  if (!card) return;

  card.querySelector(".boat-details-extended")?.classList.toggle("open");
  card.querySelector(".arrow-toggle")?.classList.toggle("rotate-icon");
}

function resetExtrasOnly(idx) {
  const card = getCard(idx);
  if (!card) return;

  card
    .querySelectorAll(".extra-checkbox")
    .forEach((cb) => (cb.checked = false));
  calculateTotalWithExtras(idx);
}

// Helper per recuperare la card
const getCard = (idx) => document.querySelectorAll(".boat-card")[idx];

/**
 * 4. LOGICA CALENDARIO E PREZZI
 */
function calculateTotalWithExtras(idx) {
  const card = getCard(idx);
  const msgEl = card?.querySelector(".selected-date-msg");
  if (!card || !msgEl) return;

  if (STATE.selectedDays[idx] === null) {
    msgEl.innerText = "Seleziona una data per vedere disponibilità";
    return;
  }

  const monthIndex = STATE.dates[idx].getMonth();
  const base = CONFIG.basePrices[idx];
  const mult = CONFIG.multipliers[monthIndex] || 1;
  const dailyPrice = Math.round(base * mult);

  const extrasTotal = Array.from(
    card.querySelectorAll(".extra-checkbox:checked"),
  ).reduce((sum, cb) => sum + parseInt(cb.getAttribute("data-price") || 0), 0);

  msgEl.innerHTML = `Scelto: ${STATE.selectedDays[idx]} ${CONFIG.months[monthIndex]} - Prezzo totale: <b>€${dailyPrice + extrasTotal}</b>`;
}

function renderCalendar(idx) {
  const card = getCard(idx);
  if (!card) return;

  const date = STATE.dates[idx];
  const month = date.getMonth();
  const year = date.getFullYear();
  const container = card.querySelector(".calendar-grid");

  // Update Header
  card.querySelector(".month-year-display").innerText =
    `${CONFIG.months[month]} ${year}`;

  const isSelectable = month >= 4 && month <= 8; // Maggio - Settembre
  const currentPrice = isSelectable
    ? Math.round(CONFIG.basePrices[idx] * (CONFIG.multipliers[month] || 0))
    : "---";
  card.querySelector(".price-display").innerText = isSelectable
    ? `€${currentPrice}`
    : "---";

  // Build Grid
  container.innerHTML = "";
  const firstDay = new Date(year, month, 1).getDay();
  const emptySlots = firstDay === 0 ? 6 : firstDay - 1;

  // Empty slots
  for (let i = 0; i < emptySlots; i++) {
    const div = document.createElement("div");
    div.className = "day-item empty";
    container.appendChild(div);
  }

  // Days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day-item";
    dayDiv.innerText = day;

    if (STATE.selectedDays[idx] === day) dayDiv.classList.add("selected");

    if (isSelectable) {
      dayDiv.onclick = () => {
        if (STATE.selectedDayElements[idx])
          STATE.selectedDayElements[idx].classList.remove("selected");
        dayDiv.classList.add("selected");
        STATE.selectedDayElements[idx] = dayDiv;
        STATE.selectedDays[idx] = day;
        calculateTotalWithExtras(idx);
      };
    } else {
      dayDiv.classList.add("disabled");
    }
    container.appendChild(dayDiv);
  }
}

function changeMonth(step, idx) {
  STATE.dates[idx].setMonth(STATE.dates[idx].getMonth() + step);
  STATE.selectedDayElements[idx] = null;
  STATE.selectedDays[idx] = null;
  renderCalendar(idx);
  calculateTotalWithExtras(idx);
}

/**
 * 5. LOGICA PRENOTAZIONE E POPUP (Checkout)
 */

// Funzione Helper per generare l'HTML (Template)
function getCheckoutTemplate({
  boatName,
  finalPrice,
  selectedExtras,
  missingExtras,
}) {
  const deposit = 50;
  const balance = finalPrice - deposit;

  // Generazione Extra Selezionati
  const extrasHtml =
    selectedExtras.length > 0
      ? selectedExtras
          .map((ex) => `<span class="tag-extra">+ ${ex}</span>`)
          .join("")
      : '<span style="font-size:0.7rem; color:#999;">Nessun extra selezionato</span>';

  // Generazione Extra Mancanti (Upsell)
  const missingExtrasHtml =
    missingExtras.length > 0
      ? `
        <div class="upsell-container">
            <div class="upsell-header">
                <i class="fas fa-magic" style="color:#d35400;"></i> Completa la tua esperienza:
            </div>
            <div class="upsell-scroll">
                ${missingExtras
                  .slice(0, 3)
                  .map(
                    (extra) => `
                    <div class="upsell-item">+ ${extra}</div>
                `,
                  )
                  .join("")}
            </div>
        </div>`
      : "";

  return `
    <style>
        /* CSS INLINE PER ISOLAMENTO E PERFORMANCE */
        :root { --primary: #003580; --accent: #00b4d8; --success: #276749; --bg: #f4f7f9; }
        
        /* Layout Generale */
        .checkout-container { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: #1a1c20; min-height: 100vh; padding-bottom: 140px; }
        
        /* Header & Tabs */
        .sticky-header { background: var(--primary); padding: 15px 20px 0 20px; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; color: white; }
        .tabs-nav { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 0px; }
        .tab-btn { background: transparent; border: none; color: rgba(255,255,255,0.6); padding: 10px 5px; font-weight: 600; font-size: 0.9rem; border-bottom: 3px solid transparent; transition: 0.3s; white-space: nowrap; cursor: pointer; }
        .tab-btn.active { color: white; border-bottom: 3px solid var(--accent); }
        
        /* Contenuto Tabs */
        .tab-content { display: none; padding: 15px; animation: fadeIn 0.3s ease; }
        .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* Card Styles */
        .card { background: white; border-radius: 16px; padding: 16px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.02); }
        .card-title { font-size: 0.85rem; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase; color: #636e72; letter-spacing: 0.5px; }
        
        /* Elementi Specifici */
        .free-cancel-badge { background: #ebfbee; border: 1px solid #b7ebc6; padding: 12px; border-radius: 12px; display: flex; align-items: center; gap: 10px; color: var(--success); font-weight: 600; font-size: 0.75rem; margin-bottom: 15px; }
        .tag-extra { background: #e3f2fd; color: var(--primary); padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; display: inline-block; margin-right: 5px; margin-bottom: 5px; }
        
        /* Upsell Section */
        .upsell-container { background: #fff9db; border-radius: 16px; padding: 16px; margin-bottom: 15px; border: 1px dashed #f1c40f; }
        .upsell-header { font-size: 0.75rem; font-weight: 800; color: #856404; margin-bottom: 10px; text-transform: uppercase; }
        .upsell-scroll { display: flex; overflow-x: auto; gap: 10px; padding-bottom: 5px; -webkit-overflow-scrolling: touch; }
        .upsell-item { background: white; padding: 8px 12px; border-radius: 8px; font-size: 0.7rem; white-space: nowrap; border: 1px solid #fcebb6; color: #856404; font-weight: 700; box-shadow: 0 2px 4px rgba(241, 196, 15, 0.1); }

        /* Timeline Itinerario */
        .timeline { border-left: 2px solid #e0e0e0; margin-left: 10px; padding-left: 20px; position: relative; }
        .timeline-item { position: relative; margin-bottom: 25px; }
        .timeline-dot { width: 12px; height: 12px; background: var(--accent); border-radius: 50%; position: absolute; left: -27px; top: 5px; border: 2px solid white; box-shadow: 0 0 0 2px var(--accent); }
        .timeline-time { font-size: 0.7rem; color: #636e72; background: #f1f2f6; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px; }
        .timeline-title { font-weight: 700; color: var(--primary); font-size: 0.9rem; }
        .timeline-desc { font-size: 0.75rem; color: #636e72; line-height: 1.4; margin-top: 2px; }

        /* Tabelle e Griglie */
        .tech-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .tech-table td { padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #2d3436; }
        .tech-table td:first-child { color: #636e72; font-weight: 500; width: 40%; }
        .tech-table tr:last-child td { border-bottom: none; }
        
        .tips-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .tip-box { background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center; }
        .tip-icon { font-size: 1.2rem; margin-bottom: 5px; color: var(--primary); }
        .tip-text { font-size: 0.7rem; color: #2d3436; font-weight: 600; line-height: 1.3; }

        /* Footer */
        .sticky-footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 15px 20px 30px 20px; box-shadow: 0 -10px 30px rgba(0,0,0,0.08); border-top: 1px solid #e6edef; z-index: 2000; }
        .price-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .main-btn { width: 100%; padding: 18px; border: none; border-radius: 14px; font-weight: 800; text-transform: uppercase; font-size: 1rem; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        
        /* Input Fields */
        .input-group { margin-bottom: 12px; position: relative; }
        .custom-input { width: 100%; padding: 16px 16px 16px 45px; border: 2px solid #edf2f7; border-radius: 12px; font-size: 16px; outline: none; transition: 0.2s; box-sizing: border-box; }
        .custom-input:focus { border-color: var(--accent); background: white; }
        .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #b2bec3; font-size: 1.1rem; }

    </style>

    <div id="booking-checkout-mobile" class="checkout-container">
        
        <div class="sticky-header">
            <div class="header-top">
                <div>
                    <div style="font-size: 0.6rem; text-transform: uppercase; opacity: 0.8;margin-top:35px; letter-spacing: 1px;">Stai prenotando</div>
                    <div style="font-weight: 700; font-size: 1.1rem;">${boatName}</div>
                </div>
                <button onclick="closeModal()" style="background: rgba(255,255,255,0.15); border: none; border-radius: 50%;margin-top: 35px; width: 36px; height: 36px; color: white; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="tabs-nav">
                <button class="tab-btn active" onclick="switchTab('summary')">Riepilogo</button>
                <button class="tab-btn" onclick="switchTab('itinerary')">Itinerari <i class="fas fa-map-marked-alt" style="font-size:0.7em; margin-left:3px"></i></button>
                <button class="tab-btn" onclick="switchTab('info')">Info & Consigli</button>
            </div>
        </div>

        <div id="tab-summary" class="tab-content active">
            
            <div class="free-cancel-badge">
                <i class="fas fa-shield-alt" style="font-size: 1.2rem;"></i>
                <div>
                    <div>Cancellazione GRATUITA</div>
                    <div style="font-weight:400; font-size: 0.65rem; opacity: 0.8;">Fino a 48h prima della partenza</div>
                </div>
            </div>

            

            <div class="card">
                <div class="card-title"><i class="far fa-calendar-alt"></i> La tua giornata</div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; margin-bottom: 12px;">
                    <div><div style="font-size: 0.65rem; color: #636e72; text-transform: uppercase;">Check-in</div><div style="font-weight: 700; color: var(--primary);">09:00</div></div>
                    <div style="text-align: center; align-self: center;"><i class="fas fa-arrow-right" style="color: #dfe6e9;"></i></div>
                    <div style="text-align: right;"><div style="font-size: 0.65rem; color: #636e72; text-transform: uppercase;">Check-out</div><div style="font-weight: 700; color: var(--primary);">18:00</div></div>
                </div>
                
                <div style="font-size: 0.75rem; color: #1a1c20;">
                    <div style="font-weight: 700; margin-bottom: 8px; color: var(--primary);">Pacchetto incluso:</div>
                    <div style="display: flex; flex-wrap: wrap;">
                        <span class="tag-extra">⚓ Gommone Standard</span>
                        ${extrasHtml}
                    </div>
                </div>
            </div>

            ${missingExtrasHtml}

            <div class="card" style="border: 1px solid #3498db;">
                <h3 class="card-title" style="color: #2980b9;">Dati Conducente</h3>
                
                <div class="input-group">
                    <i class="far fa-user input-icon"></i>
                    <input type="text" id="nome" placeholder="Nome e Cognome completo" class="custom-input">
                </div>
                
                <div class="input-group">
                    <i class="fab fa-whatsapp input-icon"></i>
                    <input type="tel" id="telefono" placeholder="Numero cellulare / WhatsApp" class="custom-input">
                </div>
            </div>

            <div class="card">
                <h3 class="card-title" style="color: #e74c3c;">Regole Fondamentali</h3>
                <ul style="margin: 0; padding: 0 0 0 18px; font-size: 0.75rem; color: #4a4d55; line-height: 1.6;">
                    <li><b>Cauzione:</b> €400 (pre-autorizzazione carta) al molo.</li>
                    <li><b>Carburante:</b> Non incluso (pieno-pieno).</li>
                    <li><b>Età minima:</b> 21 anni con documento valido.</li>
                </ul>
                <div style="margin-top: 15px; display: flex; align-items: flex-start; gap: 10px; background: #f8f9fa; padding: 12px; border-radius: 10px; border: 1px solid #eee;">
                    <input type="checkbox" id="check" style="margin-top: 3px; transform: scale(1.3);">
                    <label for="check" style="font-size: 0.7rem; color: #636e72; font-weight: 500;">
                        Dichiaro di aver letto le regole e procedo al pagamento dell'acconto di <b>€${deposit}</b>.
                    </label>
                </div>
            </div>
            
            <div style="text-align:center; font-size: 0.7rem; color: #b2bec3; margin-top: 10px;">
                <i class="fas fa-lock"></i> I tuoi dati sono protetti da crittografia SSL
            </div>
            <br>
            <br>
        </div>

        <div id="tab-itinerary" class="tab-content">

        <div class="card">
            <div class="card-title" style="color: #0984e3;"><i class="fas fa-route"></i> Tour Classico: Tavolara & Molara</div>
            <p style="font-size: 0.75rem; color: #636e72; margin-bottom: 10px;">L'itinerario perfetto per chi noleggia la prima volta. Mare calmo e colori incredibili.</p>
            <div style="margin-bottom: 15px;"><span style="font-size: 0.65rem; background: #e3f2fd; color: #0984e3; padding: 4px 8px; border-radius: 4px; font-weight: 700;"><i class="fas fa-wind"></i> IDEALE CON: OVEST / MAESTRALE</span></div>
            
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-title">Isola di Tavolara</div>
                    <div class="timeline-time"><i class="fas fa-stopwatch"></i> 25 min dal porto</div>
                    <div class="timeline-desc">Fermati allo Spalmatore. Acqua turchese e maestose scogliere. <a href="https://www.google.com/maps/search/?api=1&query=40.887,9.686" target="_blank" style="color:#0984e3; text-decoration:none; font-weight:bold;">[Maps]</a></div>
                </div>
                
                <div class="timeline-item">
                    <div class="timeline-dot" style="background: #fab1a0; box-shadow: 0 0 0 2px #fab1a0;"></div>
                    <div class="timeline-title">Piscine di Molara</div>
                    <div class="timeline-time"><i class="fas fa-stopwatch"></i> +15 min navigazione</div>
                    <div class="timeline-desc">Il paradiso dello snorkeling. Fondale bassissimo e pesci ovunque. <a href="https://www.google.com/maps/search/?api=1&query=40.871,9.708" target="_blank" style="color:#0984e3; text-decoration:none; font-weight:bold;">[Maps]</a></div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-dot" style="background: #55efc4; box-shadow: 0 0 0 2px #55efc4;"></div>
                    <div class="timeline-title">Cala Girgolu / Sassi Piatti</div>
                    <div class="timeline-time"><i class="fas fa-stopwatch"></i> +10 min navigazione</div>
                    <div class="timeline-desc">Rocce granitiche uniche e acqua piatta. Perfetto per l'ultimo bagno. <a href="https://maps.app.goo.gl/9WJAU2iAZ5y9whqw7" target="_blank" style="color:#0984e3; text-decoration:none; font-weight:bold;">[Maps]</a></div>
                </div>
            </div>
        </div>
            
        <div class="card">
        <div class="card-title" style="color: #2ecc71;"><i class="fas fa-gem"></i> Rotta Smeralda: Spiagge VIP</div>
        <p style="font-size: 0.75rem; color: #636e72; margin-bottom: 10px;">Verso Nord per scoprire le spiagge più famose del mondo e gli yacht di lusso.</p>
        <div style="margin-bottom: 15px;"><span style="font-size: 0.65rem; background: #e8f5e9; color: #2ecc71; padding: 4px 8px; border-radius: 4px; font-weight: 700;"><i class="fas fa-wind"></i> IDEALE CON: SCIROCCO / SUD</span></div>
        
        <div class="timeline">
            <div class="timeline-item">
                <div class="timeline-dot" style="background: #2ecc71;"></div>
                <div class="timeline-title">Isola di Soffi</div>
                <div class="timeline-time"><i class="fas fa-stopwatch"></i> 35 min dal porto</div>
                <div class="timeline-desc">Piscine naturali tra Soffi e Mortorio. Acqua cristallina e isolata. <a href="https://maps.app.goo.gl/hmitdNUc7GRpiwtR7" target="_blank" style="color:#2ecc71; text-decoration:none; font-weight:bold;">[Maps]</a></div>
            </div>
            
            <div class="timeline-item">
                <div class="timeline-dot" style="background: #55efc4; box-shadow: 0 0 0 2px #55efc4;"></div>
                <div class="timeline-title">Spiaggia del Principe</div>
                <div class="timeline-time"><i class="fas fa-stopwatch"></i> +15 min navigazione</div>
                <div class="timeline-desc">L'arco di sabbia più bello della Costa Smeralda. Panorama mozzafiato. <a href="https://www.google.com/maps/search/?api=1&query=41.047,9.554" target="_blank" style="color:#2ecc71; text-decoration:none; font-weight:bold;">[Maps]</a></div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot" style="background: #fab1a0; box-shadow: 0 0 0 2px #fab1a0;"></div>
                <div class="timeline-title">Cala di Volpe</div>
                <div class="timeline-time"><i class="fas fa-stopwatch"></i> +10 min navigazione</div>
                <div class="timeline-desc">Ammira i Mega Yacht nel porto più esclusivo del Mediterraneo. <a href="https://www.google.com/maps/search/?api=1&query=41.036,9.538" target="_blank" style="color:#2ecc71; text-decoration:none; font-weight:bold;">[Maps]</a></div>
            </div>
        </div>
    </div>


    <div class="card">
    <div class="card-title" style="color: #f1c40f;"><i class="fas fa-solid fa-dolphin"></i> Rotta Wild: Capo Figari</div>
    <p style="font-size: 0.75rem; color: #636e72; margin-bottom: 10px;">Navigazione sotto costa, ideale per famiglie. Altissima probabilità di vedere delfini.</p>
    <div style="margin-bottom: 15px;"><span style="font-size: 0.65rem; background: #fef9e7; color: #f1c40f; padding: 4px 8px; border-radius: 4px; font-weight: 700;"><i class="fas fa-wind"></i> IDEALE CON: TUTTI I VENTI (MOLTO RIPARATO)</span></div>
    
    <div class="timeline">
        <div class="timeline-item">
            <div class="timeline-dot" style="background: #f1c40f;"></div>
            <div class="timeline-title">Cala Moresca</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> 10 min dal porto</div>
            <div class="timeline-desc">Doppia caletta nel parco naturale. Acqua verde smeraldo e pini marittimi. <a href="https://www.google.com/maps/search/?api=1&query=40.993,9.623" target="_blank" style="color:#d4ac0d; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>
        
        <div class="timeline-item">
            <div class="timeline-dot" style="background: #fab1a0; box-shadow: 0 0 0 2px #fab1a0;"></div>
            <div class="timeline-title">Isolotto di Figarolo</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> +5 min navigazione</div>
            <div class="timeline-desc">Snorkeling con i pesci vicino all'allevamento, dove spesso saltano i delfini. <a href="https://www.google.com/maps/search/?api=1&query=40.983,9.620" target="_blank" style="color:#d4ac0d; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>

        <div class="timeline-item">
            <div class="timeline-dot" style="background: #55efc4; box-shadow: 0 0 0 2px #55efc4;"></div>
            <div class="timeline-title">Cala Greca</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> +10 min navigazione</div>
            <div class="timeline-desc">Un fiordo tra scogliere calcaree a picco. Pace e silenzio assoluto. <a href="https://www.google.com/maps/search/?api=1&query=40.999,9.635" target="_blank" style="color:#d4ac0d; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>
    </div>
</div>
            


<div class="card">
    <div class="card-title" style="color: #9b59b6;"><i class="fas fa-anchor"></i> Arcipelago di Mortorio</div>
    <p style="font-size: 0.75rem; color: #636e72; margin-bottom: 10px;">Riserva naturale integrale. Sabbia finissima e natura selvaggia lontano dalla folla.</p>
    <div style="margin-bottom: 15px;"><span style="font-size: 0.65rem; background: #f4ecf7; color: #9b59b6; padding: 4px 8px; border-radius: 4px; font-weight: 700;"><i class="fas fa-wind"></i> IDEALE CON: MAESTRALE / OVEST</span></div>
    
    <div class="timeline">
        <div class="timeline-item">
            <div class="timeline-dot" style="background: #9b59b6;"></div>
            <div class="timeline-title">Isola di Mortorio</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> 50 min dal porto</div>
            <div class="timeline-desc">Trasparenze polinesiane. Obbligo di ormeggio lontano dalla riva (Riserva). <a href="https://www.google.com/maps/search/?api=1&query=41.082,9.564" target="_blank" style="color:#9b59b6; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>
        
        <div class="timeline-item">
            <div class="timeline-dot" style="background: #55efc4; box-shadow: 0 0 0 2px #55efc4;"></div>
            <div class="timeline-title">Cala Petra Ruja</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> +15 min navigazione</div>
            <div class="timeline-desc">Spiaggia dai granelli rossastri, selvaggia e poco affollata. <a href="https://www.google.com/maps/search/?api=1&query=41.026,9.529" target="_blank" style="color:#9b59b6; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>

        <div class="timeline-item">
            <div class="timeline-dot" style="background: #fab1a0; box-shadow: 0 0 0 2px #fab1a0;"></div>
            <div class="timeline-title">Razza di Juncu</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> +5 min navigazione</div>
            <div class="timeline-desc">Acqua bassa e cristallina, ideale per far nuotare i bambini. <a href="https://www.google.com/maps/search/?api=1&query=41.031,9.539" target="_blank" style="color:#9b59b6; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>
    </div>
</div>


<div class="card">
    <div class="card-title" style="color: #e67e22;"><i class="fas fa-cocktail"></i> Tour Glamour: Porto Rotondo</div>
    <p style="font-size: 0.75rem; color: #636e72; margin-bottom: 10px;">Esplora le ville di Punta Volpe e le spiagge più chic del golfo di Cugnana.</p>
    <div style="margin-bottom: 15px;"><span style="font-size: 0.65rem; background: #fdf2e9; color: #e67e22; padding: 4px 8px; border-radius: 4px; font-weight: 700;"><i class="fas fa-wind"></i> IDEALE CON: LEVANTE / EST</span></div>
    
    <div class="timeline">
        <div class="timeline-item">
            <div class="timeline-dot" style="background: #e67e22;"></div>
            <div class="timeline-title">Punta Volpe</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> 25 min dal porto</div>
            <div class="timeline-desc">Ville spettacolari e snorkeling tra scogli di granito rosa. <a href="https://www.google.com/maps/search/?api=1&query=41.035,9.542" target="_blank" style="color:#e67e22; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>
        
        <div class="timeline-item">
            <div class="timeline-dot" style="background: #fab1a0; box-shadow: 0 0 0 2px #fab1a0;"></div>
            <div class="timeline-title">Spiaggia Ira</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> +10 min navigazione</div>
            <div class="timeline-desc">Acqua color smeraldo chiaro e sabbia finissima. Molto elegante. <a href="https://www.google.com/maps/search/?api=1&query=41.030,9.520" target="_blank" style="color:#e67e22; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>

        <div class="timeline-item">
            <div class="timeline-dot" style="background: #55efc4; box-shadow: 0 0 0 2px #55efc4;"></div>
            <div class="timeline-title">Golfo di Marinella</div>
            <div class="timeline-time"><i class="fas fa-stopwatch"></i> +10 min navigazione</div>
            <div class="timeline-desc">Ampia baia riparata, perfetta per un aperitivo in barca al tramonto. <a href="https://www.google.com/maps/search/?api=1&query=41.002,9.560" target="_blank" style="color:#e67e22; text-decoration:none; font-weight:bold;">[Maps]</a></div>
        </div>
    </div>
</div>



        <div class="card" style="background: #2d3436; color: white;">
            <div style="display:flex; gap:15px; align-items:center;">
                <i class="fas fa-gas-pump" style="font-size: 1.5rem; color: #ffeaa7;"></i>
                <div>
                        <div style="font-weight: 700; font-size: 0.9rem;">Nota Carburante</div>
                        <div style="font-size: 0.7rem; opacity: 0.8; margin-top:4px;">Per questo itinerario il consumo medio stimato è di circa €40-€60 (variabile in base allo stile di guida e mare).</div>
                    </div>
                </div>
            </div>
            <br>
        </div>

        <div id="tab-info" class="tab-content">
            
            <div class="card">
                <div class="card-title">Scheda Tecnica Gommone</div>
                <table class="tech-table">
                    <tr><td>Lunghezza</td><td>5.80 Metri</td></tr>
                    <tr><td>Motore</td><td>40cv (Senza Patente)</td></tr>
                    <tr><td>Portata Max</td><td>6 Persone</td></tr>
                    <tr><td>Dotazioni</td><td>Tendalino, Scaletta, Cuscineria</td></tr>
                    <tr><td>Stereo</td><td>Bluetooth / USB</td></tr>
                </table>
            </div>

            <div class="card">
                <div class="card-title">Cosa portare a bordo</div>
                <div class="tips-grid">
                    <div class="tip-box">
                        <div class="tip-icon">💧</div>
                        <div class="tip-text">Acqua (tanta!)</div>
                    </div>
                    <div class="tip-box">
                        <div class="tip-icon">☀️</div>
                        <div class="tip-text">Crema Solare</div>
                    </div>
                    <div class="tip-box">
                        <div class="tip-icon">🧢</div>
                        <div class="tip-text">Cappello</div>
                    </div>
                    <div class="tip-box">
                        <div class="tip-icon">🔋</div>
                        <div class="tip-text">Powerbank</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title"><i class="fas fa-question-circle"></i> Info Utili</div>
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: 700; font-size: 0.8rem; color: var(--primary);">Serve la patente nautica?</div>
                    <div style="font-size: 0.75rem; color: #636e72;">No, tutti i nostri gommoni da 40cv si guidano senza patente. Faremo un briefing completo prima della partenza.</div>
                </div>
                <div style="border-top: 1px solid #eee; padding-top: 10px;">
                    <div style="font-weight: 700; font-size: 0.8rem; color: var(--primary);">Posso portare animali?</div>
                    <div style="font-size: 0.75rem; color: #636e72;">Sì, cani di piccola taglia sono ammessi, ma attenzione al caldo e al sole!</div>
                </div>
            </div>
            <br>
        </div>

        <div class="sticky-footer">
            <div class="price-row">
                <div>
                    <div style="font-size: 0.65rem; color: #636e72; font-weight: 700; text-transform: uppercase;">Totale Saldo al molo:</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #003580;">€${balance}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.65rem; color: #276749; font-weight: 700; text-transform: uppercase;">Acconto ora:</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #276749;">€${deposit},00</div>
                </div>
            </div>
            
            <button id="confirm-booking-btn" disabled class="main-btn" style="background: #dfe6e9; color: #b2bec3;">
                Conferma e Paga €${deposit}
            </button>
        </div>
    </div>
    `;
}

function switchTab(tabId) {
  // Rimuovi active da tutti i bottoni e contenuti
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));

  // Attiva quello corrente
  const btnIndex = tabId === "summary" ? 0 : tabId === "itinerary" ? 1 : 2;
  document.querySelectorAll(".tab-btn")[btnIndex].classList.add("active");
  document.getElementById("tab-" + tabId).classList.add("active");
}