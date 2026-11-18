/* =========================================================
   Opciones de accesibilidad — Portal Biblioteca Meira Delmar
   Mismo conjunto de herramientas que ofrece el portal de la Gobernación del Atlántico:
   tamaño y espaciado del texto, colores invertidos, tonos grises, subrayado de enlaces,
   cursor grande, guía de lectura, texto a voz y voz a texto.
   Las preferencias se guardan en el navegador del visitante y se aplican en todas las páginas.
   ========================================================= */
(() => {
  const CLAVE = 'bmd-accesibilidad';
  const LIMITES = { texto: [-2, 5], espaciado: [0, 4] };
  const BASE = { texto: 0, espaciado: 0, invertir: false, grises: false, subrayar: false, cursor: false, guia: false, voz: false };
  const raiz = document.documentElement;

  const leer = () => {
    try { return { ...BASE, ...JSON.parse(localStorage.getItem(CLAVE) || '{}') }; } catch (e) { return { ...BASE }; }
  };
  const guardar = (estado) => {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* modo privado: solo dura esta visita */ }
  };
  let estado = leer();

  /* ---------- Aplicar preferencias (se ejecuta antes de dibujar, para evitar parpadeos) ---------- */
  function aplicar() {
    raiz.style.setProperty('--a11y-escala', String(1 + estado.texto * 0.1));
    raiz.style.setProperty('--a11y-espaciado', String(estado.espaciado));
    raiz.classList.toggle('a11y-texto', estado.texto !== 0);
    raiz.classList.toggle('a11y-espaciado', estado.espaciado > 0);
    raiz.classList.toggle('a11y-invertir', estado.invertir);
    raiz.classList.toggle('a11y-grises', estado.grises);
    raiz.classList.toggle('a11y-subrayar', estado.subrayar);
    raiz.classList.toggle('a11y-cursor', estado.cursor);
    const filtros = [estado.invertir && 'invert(1) hue-rotate(180deg)', estado.grises && 'grayscale(1)'].filter(Boolean);
    raiz.style.setProperty('--a11y-filtro', filtros.length ? filtros.join(' ') : 'none');
    guia(estado.guia);
    if (!estado.voz) textoAVoz.detener();
  }

  /* ---------- Guía de lectura: franja clara que sigue al puntero y oscurece el resto ---------- */
  let franja = null;
  function guia(activa) {
    if (!document.body) return;
    if (activa && !franja) {
      franja = document.createElement('div');
      franja.className = 'a11y-guia';
      franja.setAttribute('aria-hidden', 'true');
      franja.innerHTML = '<span class="a11y-guia__arriba"></span><span class="a11y-guia__abajo"></span>';
      document.body.appendChild(franja);
      document.addEventListener('pointermove', moverGuia, { passive: true });
      moverGuia({ clientY: window.innerHeight / 2 });
    } else if (!activa && franja) {
      document.removeEventListener('pointermove', moverGuia);
      franja.remove();
      franja = null;
    }
  }
  function moverGuia(e) {
    if (franja) franja.style.setProperty('--y', `${e.clientY}px`);
  }

  /* ---------- Texto a voz: lee el elemento que se señala o se enfoca ---------- */
  const textoAVoz = (() => {
    const disponible = 'speechSynthesis' in window;
    let actual = null;
    let espera = null;
    const LEIBLES = 'h1, h2, h3, h4, p, li, a, button, label, dt, dd, td, th, figcaption, blockquote, summary, .tile__title, .news-card__title';

    function voz(idioma) {
      const voces = speechSynthesis.getVoices();
      const corto = idioma.slice(0, 2);
      return voces.find((v) => v.lang.toLowerCase() === 'es-co')
        || voces.find((v) => v.lang.toLowerCase().startsWith(idioma.toLowerCase()))
        || voces.find((v) => v.lang.toLowerCase().startsWith(corto));
    }
    function leerTexto(texto, elemento) {
      if (!disponible || !texto) return;
      speechSynthesis.cancel();
      marcar(elemento);
      const idioma = raiz.lang || 'es';
      const u = new SpeechSynthesisUtterance(texto.slice(0, 600));
      u.lang = idioma.startsWith('es') ? 'es-CO' : idioma;
      const v = voz(u.lang);
      if (v) u.voice = v;
      u.rate = 0.95;
      u.onend = () => marcar(null);
      speechSynthesis.speak(u);
    }
    function marcar(elemento) {
      if (actual) actual.classList.remove('a11y-leyendo');
      actual = elemento;
      if (actual) actual.classList.add('a11y-leyendo');
    }
    function objetivo(nodo) {
      const el = nodo && nodo.closest && nodo.closest(LEIBLES);
      if (!el || el.closest('.a11y')) return null;
      return el;
    }
    function alSenalar(e) {
      if (!estado.voz) return;
      const el = objetivo(e.target);
      if (!el || el === actual) return;
      clearTimeout(espera);
      espera = setTimeout(() => {
        const texto = (el.getAttribute('aria-label') || el.innerText || el.textContent || el.alt || '').replace(/\s+/g, ' ').trim();
        leerTexto(texto, el);
      }, e.type === 'focusin' ? 0 : 450);
    }
    document.addEventListener('mouseover', alSenalar, { passive: true });
    document.addEventListener('focusin', alSenalar);
    // Texto seleccionado con el mouse: se lee completo
    document.addEventListener('mouseup', () => {
      if (!estado.voz) return;
      const sel = String(window.getSelection() || '').trim();
      if (sel.length > 2) leerTexto(sel, null);
    });
    return {
      disponible,
      leer: leerTexto,
      detener() { if (disponible) speechSynthesis.cancel(); clearTimeout(espera); marcar(null); }
    };
  })();

  /* ---------- Voz a texto: dictado en campos y órdenes de navegación ---------- */
  const vozATexto = (() => {
    const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    let escuchando = false;
    let alCambiar = () => {};
    const PAGINAS = {
      inicio: 'index.html', biblioteca: 'historia.html', historia: 'historia.html', servicios: 'servicios.html',
      catalogo: 'catalogo.html', agenda: 'agenda.html', visitanos: 'visitanos.html', contacto: 'contacto.html',
      accesibilidad: 'accesibilidad.html'
    };
    const normal = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

    function orden(frase) {
      const f = normal(frase);
      const campo = document.activeElement;
      // Si hay un campo de texto enfocado, se dicta en él
      if (campo && (campo.tagName === 'TEXTAREA' || (campo.tagName === 'INPUT' && /^(text|search|email|tel)$/.test(campo.type)))) {
        campo.value = (campo.value ? campo.value + ' ' : '') + frase;
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        return `Escrito en el campo: «${frase}»`;
      }
      const ir = f.match(/^(?:ir a|abrir|ve a|llevame a)\s+(?:la |el |los )?(.+)$/);
      if (ir) {
        const destino = Object.keys(PAGINAS).find((k) => ir[1].includes(k));
        if (destino) { location.href = PAGINAS[destino]; return `Abriendo ${destino}…`; }
      }
      if (/^(bajar|baja|abajo)/.test(f)) { window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }); return 'Bajando'; }
      if (/^(subir|sube|arriba)/.test(f)) { window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' }); return 'Subiendo'; }
      const buscar = f.match(/^buscar\s+(.+)$/);
      if (buscar) {
        window.open(`https://biblioteca.atlantico.gov.co:8001/cgi-bin/koha/opac-search.pl?q=${encodeURIComponent(buscar[1])}`, '_blank', 'noopener');
        return `Buscando «${buscar[1]}» en el catálogo`;
      }
      return `No entendí «${frase}». Prueba: «ir a servicios», «bajar» o «buscar Meira Delmar».`;
    }

    return {
      disponible: !!Reconocimiento,
      get activo() { return escuchando; },
      alternar(callback) {
        alCambiar = callback;
        if (escuchando) { rec.stop(); return; }
        rec = new Reconocimiento();
        rec.lang = 'es-CO';
        rec.interimResults = false;
        rec.continuous = true;
        rec.onstart = () => { escuchando = true; alCambiar(true, 'Escuchando… di «ir a servicios», «bajar» o dicta en un campo.'); };
        rec.onresult = (e) => {
          const frase = e.results[e.results.length - 1][0].transcript;
          alCambiar(true, orden(frase));
        };
        rec.onerror = (e) => {
          const motivos = { 'not-allowed': 'Debes permitir el uso del micrófono en el navegador.', 'no-speech': 'No se escuchó nada. Inténtalo de nuevo.' };
          alCambiar(false, motivos[e.error] || 'No se pudo usar el micrófono.');
        };
        rec.onend = () => { escuchando = false; alCambiar(false); };
        rec.start();
      }
    };
  })();

  /* ---------- Panel ---------- */
  const ICONOS = {
    mas: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7.5 10h5M10 7.5v5"/>',
    menos: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7.5 10h5"/>',
    abrir: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
    cerrar: '<path d="M3 7l5 5-5 5M21 7l-5 5 5 5"/>',
    invertir: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/>',
    grises: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M4 4l16 16"/>',
    subrayar: '<path d="M7 4v6a5 5 0 0 0 10 0V4M5 20h14"/>',
    cursor: '<path d="M6 3l12 9-5.5 1.2L15 19l-2.6 1.2-2.5-5.6L6 18z" fill="currentColor"/>',
    guia: '<path d="M3 6h18M3 18h18"/><path d="M3 12h18" stroke-dasharray="2 2"/>',
    voz: '<path d="M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'
  };
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>`;
  const OPCIONES = [
    { id: 'texto+', icono: 'mas', texto: 'Aumentar el tamaño del texto' },
    { id: 'texto-', icono: 'menos', texto: 'Disminuir el tamaño del texto' },
    { id: 'espaciado+', icono: 'abrir', texto: 'Aumentar el espaciado del texto' },
    { id: 'espaciado-', icono: 'cerrar', texto: 'Disminuir el espaciado del texto' },
    { id: 'invertir', icono: 'invertir', texto: 'Invertir colores', interruptor: true },
    { id: 'grises', icono: 'grises', texto: 'Tonos grises', interruptor: true },
    { id: 'subrayar', icono: 'subrayar', texto: 'Subrayar enlaces', interruptor: true },
    { id: 'cursor', icono: 'cursor', texto: 'Cursor grande', interruptor: true },
    { id: 'guia', icono: 'guia', texto: 'Guía de lectura', interruptor: true },
    { id: 'voz', icono: 'voz', texto: 'Texto a voz', interruptor: true },
    { id: 'dictado', icono: 'mic', texto: 'Voz a texto', interruptor: true }
  ];

  function montar(contenedor) {
    const boton = contenedor.querySelector('.a11y__btn');
    let panel = null;
    let aviso = null;

    function construir() {
      contenedor.insertAdjacentHTML('beforeend', `
        <div class="a11y__panel" id="a11yPanel" role="dialog" aria-labelledby="a11yTitulo" hidden>
          <div class="a11y__cabeza">
            <button type="button" class="a11y__icono-btn a11y__cerrar" aria-label="Cerrar opciones de accesibilidad">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
            <h2 class="a11y__titulo" id="a11yTitulo">Opciones de accesibilidad</h2>
            <button type="button" class="a11y__icono-btn a11y__reiniciar" aria-label="Restablecer todas las opciones">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>
            </button>
          </div>
          <ul class="a11y__lista" role="list">
            ${OPCIONES.map((o) => `
              <li><button type="button" class="a11y__opcion" data-accion="${o.id}"${o.interruptor ? ' aria-pressed="false"' : ''}>
                ${icono(o.icono)}<span>${o.texto}</span><span class="a11y__nivel" aria-hidden="true"></span>
              </button></li>`).join('')}
          </ul>
          <p class="a11y__aviso" role="status" aria-live="polite"></p>
        </div>`);
      panel = contenedor.querySelector('.a11y__panel');
      aviso = panel.querySelector('.a11y__aviso');

      if (!textoAVoz.disponible) desactivar('voz', 'Este navegador no puede leer en voz alta.');
      if (!vozATexto.disponible) desactivar('dictado', 'Disponible en Chrome y Edge.');

      panel.querySelector('.a11y__cerrar').addEventListener('click', () => cerrar(true));
      panel.querySelector('.a11y__reiniciar').addEventListener('click', () => {
        estado = { ...BASE };
        guardar(estado); aplicar(); pintar();
        avisar('Se restablecieron todas las opciones.');
      });
      panel.addEventListener('click', (e) => {
        const b = e.target.closest('.a11y__opcion');
        if (b && !b.disabled) ejecutar(b.dataset.accion);
      });
      panel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrar(true);
        if (e.key === 'Tab') { // el foco circula dentro del panel mientras está abierto
          const f = [...panel.querySelectorAll('button:not([disabled])')];
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      });
      pintar();
    }

    function desactivar(id, motivo) {
      const b = panel.querySelector(`[data-accion="${id}"]`);
      b.disabled = true;
      b.querySelector('.a11y__nivel').textContent = motivo;
      b.querySelector('.a11y__nivel').removeAttribute('aria-hidden');
    }

    function avisar(texto) { if (aviso) aviso.textContent = texto; }

    function pintar() {
      if (!panel) return;
      const nivel = (id, texto) => { panel.querySelector(`[data-accion="${id}"] .a11y__nivel`).textContent = texto; };
      const pct = `${Math.round((1 + estado.texto * 0.1) * 100)} %`;
      nivel('texto+', estado.texto ? pct : ''); nivel('texto-', '');
      nivel('espaciado+', estado.espaciado ? `Nivel ${estado.espaciado}` : ''); nivel('espaciado-', '');
      ['invertir', 'grises', 'subrayar', 'cursor', 'guia', 'voz'].forEach((k) => {
        const b = panel.querySelector(`[data-accion="${k}"]`);
        if (!b.disabled) b.setAttribute('aria-pressed', String(!!estado[k]));
      });
      const d = panel.querySelector('[data-accion="dictado"]');
      if (!d.disabled) d.setAttribute('aria-pressed', String(vozATexto.activo));
      panel.querySelector('[data-accion="texto+"]').disabled = estado.texto >= LIMITES.texto[1];
      panel.querySelector('[data-accion="texto-"]').disabled = estado.texto <= LIMITES.texto[0];
      panel.querySelector('[data-accion="espaciado+"]').disabled = estado.espaciado >= LIMITES.espaciado[1];
      panel.querySelector('[data-accion="espaciado-"]').disabled = estado.espaciado <= LIMITES.espaciado[0];
      const algo = JSON.stringify(estado) !== JSON.stringify(BASE);
      boton.classList.toggle('is-activo', algo);
    }

    function ejecutar(accion) {
      const limitar = (k, v) => Math.min(LIMITES[k][1], Math.max(LIMITES[k][0], v));
      const mensajes = {
        invertir: ['Colores invertidos activados.', 'Colores invertidos desactivados.'],
        grises: ['Tonos grises activados.', 'Tonos grises desactivados.'],
        subrayar: ['Enlaces subrayados.', 'Enlaces sin subrayado.'],
        cursor: ['Cursor grande activado.', 'Cursor normal.'],
        guia: ['Guía de lectura activada: mueve el mouse para desplazarla.', 'Guía de lectura desactivada.'],
        voz: ['Texto a voz activado: pasa el mouse sobre un texto para escucharlo.', 'Texto a voz desactivado.']
      };
      if (accion === 'dictado') {
        vozATexto.alternar((activo, texto) => { pintar(); if (texto) avisar(texto); });
        return;
      }
      if (accion === 'texto+' || accion === 'texto-') {
        estado.texto = limitar('texto', estado.texto + (accion === 'texto+' ? 1 : -1));
        avisar(`Tamaño del texto: ${Math.round((1 + estado.texto * 0.1) * 100)} %.`);
      } else if (accion === 'espaciado+' || accion === 'espaciado-') {
        estado.espaciado = limitar('espaciado', estado.espaciado + (accion === 'espaciado+' ? 1 : -1));
        avisar(estado.espaciado ? `Espaciado del texto: nivel ${estado.espaciado}.` : 'Espaciado normal.');
      } else {
        estado[accion] = !estado[accion];
        avisar(mensajes[accion][estado[accion] ? 0 : 1]);
        if (accion === 'voz' && estado.voz) textoAVoz.leer('Texto a voz activado.', null);
      }
      guardar(estado);
      aplicar();
      pintar();
    }

    function abrir() {
      if (!panel) construir();
      panel.hidden = false;
      void panel.offsetWidth;
      contenedor.classList.add('is-open');
      boton.setAttribute('aria-expanded', 'true');
      panel.querySelector('.a11y__opcion:not([disabled])').focus();
    }
    function cerrar(devolverFoco) {
      if (!panel) return;
      contenedor.classList.remove('is-open');
      boton.setAttribute('aria-expanded', 'false');
      setTimeout(() => { if (!contenedor.classList.contains('is-open')) panel.hidden = true; }, 220);
      if (devolverFoco) boton.focus();
    }

    boton.addEventListener('click', () => (contenedor.classList.contains('is-open') ? cerrar(false) : abrir()));
    document.addEventListener('click', (e) => { if (panel && !contenedor.contains(e.target)) cerrar(false); });
    boton.classList.toggle('is-activo', JSON.stringify(estado) !== JSON.stringify(BASE));
  }

  aplicar();
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-a11y]').forEach(montar);
    if (estado.guia) guia(true);
  });
})();
