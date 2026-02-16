const switcher = document.getElementById('langSwitcher');
const currentLang = document.getElementById('currentLang');
const buttons = document.querySelectorAll('.lang-dropdown button');

function updateDropdown(selectedLang) {
  buttons.forEach(btn => {
    btn.style.display = (btn.dataset.lang === selectedLang) ? 'none' : '';
  });
}

currentLang.addEventListener('click', () => {
  switcher.classList.toggle('open');
});

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentLang.innerHTML = btn.querySelector('svg').outerHTML;
    currentLang.dataset.lang = btn.dataset.lang;
    switcher.classList.remove('open');
    updateDropdown(btn.dataset.lang);

    // setLanguage(btn.dataset.lang)
  });
});

// inizializza: nasconde la lingua mostrata all’apertura
updateDropdown(currentLang.dataset.lang);