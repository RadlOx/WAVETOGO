// Funzione per espandere/chiudere i dettagli
function toggleItinerary(btn) {
    const card = btn.closest('.itinerary-card');
    const details = card.querySelector('.expanded-details');
    const icon = btn.querySelector('i');

    details.classList.toggle('show');
    
    if (details.classList.contains('show')) {
        btn.innerHTML = `Chiudi Dettagli <i class="fas fa-chevron-up"></i>`;
    } else {
        btn.innerHTML = `Vedi Dettagli Rotta <i class="fas fa-chevron-down"></i>`;
    }
}

// Funzione Filtri
function filterItineraries(category) {
    // Gestione bottoni attivi
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filtraggio card
    const cards = document.querySelectorAll('.itinerary-card');
    cards.forEach(card => {
        if (category === 'tutti' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease forwards';
        } else {
            card.style.display = 'none';
        }
    });
}