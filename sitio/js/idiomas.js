/* =========================================================
   Selector de idioma — Portal Biblioteca Meira Delmar
   Usa el traductor de Google (igual que atlantico.gov.co) con una interfaz propia.
   El script de Google solo se descarga si el visitante elige un idioma distinto al
   español: quien navega en español no hace ninguna petición a Google.
   ========================================================= */
(() => {
  const IDIOMA_BASE = 'es';

  // Banderas dibujadas en SVG: Windows no muestra emojis de banderas.
  const BANDERAS = {
    es: '<rect width="30" height="10" fill="#FCD116"/><rect y="10" width="30" height="5" fill="#003893"/><rect y="15" width="30" height="5" fill="#CE1126"/>',
    en: '<rect width="30" height="20" fill="#fff"/>' +
        [0, 2, 4, 6, 8, 10, 12].map((k) => `<rect y="${(k * 20 / 13).toFixed(2)}" width="30" height="${(20 / 13).toFixed(2)}" fill="#B22234"/>`).join('') +
        '<rect width="12.5" height="10.77" fill="#3C3B6E"/>' +
        [[2, 2], [5, 2], [8, 2], [11, 2], [3.5, 4.5], [6.5, 4.5], [9.5, 4.5], [2, 7], [5, 7], [8, 7], [11, 7], [3.5, 9.3], [6.5, 9.3], [9.5, 9.3]]
          .map(([x, y]) => `<circle cx="${x - 0.5}" cy="${y - 0.6}" r=".55" fill="#fff"/>`).join(''),
    'zh-TW': '<rect width="30" height="20" fill="#FE0000"/><rect width="15" height="10" fill="#000095"/>' +
        `<polygon fill="#fff" points="${Array.from({ length: 24 }, (_, k) => {
          const r = k % 2 ? 1.75 : 3.1, a = (Math.PI * 2 * k) / 24 - Math.PI / 2;
          return `${(7.5 + r * Math.cos(a)).toFixed(2)},${(5 + r * Math.sin(a)).toFixed(2)}`;
        }).join(' ')}"/>` +
        '<circle cx="7.5" cy="5" r="1.75" fill="#000095"/><circle cx="7.5" cy="5" r="1.45" fill="#fff"/>',
    fr: '<rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ED2939"/>',
    de: '<rect width="30" height="6.67" fill="#000"/><rect y="6.67" width="30" height="6.67" fill="#DD0000"/><rect y="13.33" width="30" height="6.67" fill="#FFCE00"/>',
    it: '<rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE2B37"/>',
    pt: '<rect width="30" height="20" fill="#009C3B"/><polygon points="3,10 15,2.2 27,10 15,17.8" fill="#FFDF00"/><circle cx="15" cy="10" r="4.4" fill="#002776"/><path d="M10.7 9.1 Q15 7.4 19.3 10.4" stroke="#fff" stroke-width=".8" fill="none"/>'
  };

  // Mismo orden de banderas que en el portal de la Gobernación
  const IDIOMAS = [
    { code: 'en', nombre: 'English', region: 'Estados Unidos' },
    { code: 'zh-TW', nombre: '中文（台灣）', region: 'Taiwán' },
    { code: 'fr', nombre: 'Français', region: 'Francia' },
    { code: 'de', nombre: 'Deutsch', region: 'Alemania' },
    { code: 'it', nombre: 'Italiano', region: 'Italia' },
    { code: 'pt', nombre: 'Português', region: 'Brasil' },
    { code: 'es', nombre: 'Español', region: 'Colombia' }
  ];

  // El título rotativo de la portada se traduce a mano: Google traduce cada palabra suelta
  // y produce frases incorrectas ("A place for imagine").
  const TITULOS = {
    es: ['Un lugar para', 'leer', 'aprender', 'imaginar', 'encontrarnos'],
    en: ['A place to', 'read', 'learn', 'imagine', 'come together'],
    'zh-TW': ['在這裡', '閱讀', '學習', '想像', '相聚'],
    fr: ['Un lieu pour', 'lire', 'apprendre', 'imaginer', 'se retrouver'],
    de: ['Ein Ort zum', 'Lesen', 'Lernen', 'Träumen', 'Begegnen'],
    it: ['Un luogo per', 'leggere', 'imparare', 'immaginare', 'incontrarci'],
    pt: ['Um lugar para', 'ler', 'aprender', 'imaginar', 'nos encontrar']
  };
  function traducirTitulo(code) {
    const h1 = document.getElementById('hero-title');
    const t = TITULOS[code];
    if (!h1 || !t) return;
    h1.classList.add('notranslate');
    h1.querySelector('.hero-x__line').textContent = t[0];
    h1.querySelectorAll('.rotator__word').forEach((w, i) => { w.textContent = t[i + 1]; });
    const sr = h1.querySelector('.sr-only');
    if (sr) sr.textContent = `${t.slice(1, -1).join(', ')}, ${t[t.length - 1]}`;
  }

  const bandera = (code) =>
    `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false">${BANDERAS[code]}</svg>`;

  /* ---- Cookie que usa el traductor de Google: googtrans=/es/<idioma> ---- */
  const leerIdioma = () => {
    const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([^;]+)/);
    const code = m ? decodeURIComponent(m[1]) : IDIOMA_BASE;
    return BANDERAS[code] ? code : IDIOMA_BASE;
  };
  const dominios = () => {
    const h = location.hostname;
    // En localhost no se puede fijar el atributo domain
    return h && h.includes('.') && !/^\d+(\.\d+){3}$/.test(h) ? ['', `; domain=${h}`, `; domain=.${h.split('.').slice(-2).join('.')}`] : [''];
  };
  const guardarIdioma = (code) => {
    dominios().forEach((d) => {
      document.cookie = code === IDIOMA_BASE
        ? `googtrans=; path=/; max-age=0${d}`
        : `googtrans=/${IDIOMA_BASE}/${code}; path=/; max-age=31536000; SameSite=Lax${d}`;
    });
  };

  /* ---- Carga diferida del traductor ---- */
  let cargando = null;
  function cargarTraductor() {
    if (cargando) return cargando;
    cargando = new Promise((resolve, reject) => {
      const host = document.createElement('div');
      host.id = 'google_translate_element';
      host.className = 'gt-host';
      host.setAttribute('aria-hidden', 'true');
      document.body.appendChild(host);
      window.bmdTraductorListo = () => {
        new window.google.translate.TranslateElement({
          pageLanguage: IDIOMA_BASE,
          includedLanguages: IDIOMAS.map((i) => i.code).join(','),
          autoDisplay: false
        }, 'google_translate_element');
        resolve();
      };
      const s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=bmdTraductorListo';
      s.async = true;
      s.onerror = () => { cargando = null; reject(new Error('traductor')); };
      document.head.appendChild(s);
    });
    return cargando;
  }

  // Cambia el idioma sin recargar cuando el traductor ya está activo
  function aplicarConSelector(code, intentos = 40) {
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
      return;
    }
    if (intentos > 0) setTimeout(() => aplicarConSelector(code, intentos - 1), 150);
  }

  /* ---- Interfaz ----
     El botón viene escrito en el HTML de cada página; el panel con las banderas
     se construye la primera vez que se abre, para no hacer ese trabajo durante la carga. */
  function montar(raiz) {
    const info = (code) => IDIOMAS.find((i) => i.code === code);
    const btn = raiz.querySelector('.lang__btn');
    if (!btn) return;
    let panel = null;
    let opciones = [];

    function actualizarBoton(code) {
      btn.querySelector('.flag').outerHTML = bandera(code);
      btn.querySelector('.lang__code').textContent = code === 'zh-TW' ? '中文' : code.slice(0, 2).toUpperCase();
      btn.setAttribute('aria-label', `Cambiar idioma. Idioma actual: ${info(code).nombre}`);
      opciones.forEach((o) => {
        const on = o.dataset.code === code;
        o.classList.toggle('is-current', on);
        o.setAttribute('aria-checked', String(on));
      });
    }

    function construirPanel() {
      const actual = leerIdioma();
      raiz.insertAdjacentHTML('beforeend', `
        <div class="lang__panel" role="menu" aria-label="Idioma del sitio" hidden>
          <p class="lang__title">Idioma <span>·</span> Language</p>
          <ul class="lang__list" role="none">
            ${IDIOMAS.map((i) => `
              <li role="none">
                <button type="button" class="lang__opt${i.code === actual ? ' is-current' : ''}" role="menuitemradio"
                  aria-checked="${i.code === actual}" data-code="${i.code}" lang="${i.code}">
                  ${bandera(i.code)}
                  <span class="lang__name">${i.nombre}<small>${i.region}</small></span>
                  <svg class="lang__check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>
                </button>
              </li>`).join('')}
          </ul>
          <p class="lang__note">Traducción automática de Google. El texto oficial es el español.</p>
        </div>`);
      panel = raiz.querySelector('.lang__panel');
      opciones = [...panel.querySelectorAll('.lang__opt')];

      panel.addEventListener('keydown', (e) => {
        const i = opciones.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); opciones[(i + 1) % opciones.length].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); opciones[(i - 1 + opciones.length) % opciones.length].focus(); }
        if (e.key === 'Home') { e.preventDefault(); opciones[0].focus(); }
        if (e.key === 'End') { e.preventDefault(); opciones[opciones.length - 1].focus(); }
        if (e.key === 'Escape' || e.key === 'Tab') cerrar(e.key === 'Escape');
      });

      opciones.forEach((o) => o.addEventListener('click', async () => {
        const code = o.dataset.code;
        if (code === leerIdioma()) { cerrar(true); return; }
        guardarIdioma(code);
        if (code === IDIOMA_BASE) { location.reload(); return; } // volver al original exige recargar
        raiz.classList.add('is-loading');
        try {
          await cargarTraductor();
          traducirTitulo(code);
          aplicarConSelector(code);
          actualizarBoton(code);
          cerrar(true);
        } catch (err) {
          guardarIdioma(IDIOMA_BASE);
          panel.querySelector('.lang__note').textContent = 'No se pudo conectar con el traductor. Revisa tu conexión e inténtalo de nuevo.';
        } finally {
          raiz.classList.remove('is-loading');
        }
      }));
    }

    const abrir = (enfocar) => {
      if (!panel) construirPanel();
      panel.hidden = false;
      void panel.offsetWidth; // fuerza el estilo inicial para que la transición se vea
      raiz.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      if (enfocar) (opciones.find((o) => o.classList.contains('is-current')) || opciones[0]).focus();
    };
    function cerrar(devolverFoco) {
      if (!panel) return;
      raiz.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      setTimeout(() => { if (!raiz.classList.contains('is-open')) panel.hidden = true; }, 200);
      if (devolverFoco) btn.focus();
    }

    btn.addEventListener('click', () => (raiz.classList.contains('is-open') ? cerrar() : abrir(false)));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(true); }
    });
    document.addEventListener('click', (e) => { if (!raiz.contains(e.target)) cerrar(); });

    // Si el visitante ya había elegido otro idioma, se traduce al cargar
    const actual = leerIdioma();
    if (actual !== IDIOMA_BASE) {
      actualizarBoton(actual);
      traducirTitulo(actual);
      cargarTraductor().then(() => aplicarConSelector(actual)).catch(() => guardarIdioma(IDIOMA_BASE));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-lang-switcher]').forEach(montar);
  });
})();
