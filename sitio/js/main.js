/* =========================================================
   Biblioteca Meira Delmar — Interacciones principales
   - Menú móvil accesible
   - Encabezado con sombra al hacer scroll
   - Aparición suave de elementos (scroll reveal)
   ========================================================= */
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHeaderShadow();
  initReveal();
  initSubnav();
  initHours();
  initProgressAndTop();
  initRotator();
  initCounters();
  initShelfTilt();
  initNews();
  initAgenda();
  initContactForm();
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});

/* Menú móvil: abre/cierra, cierra con Escape o al elegir un enlace */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Cerrar menú' : 'Abrir menú';
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
}

/* Encabezado: agrega borde/sombra cuando la página se desplaza */
function initHeaderShadow() {
  const header = document.getElementById('header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* Scroll reveal: muestra los elementos .reveal al entrar en pantalla, en cascada */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Retraso escalonado para elementos hermanos (tarjetas, eventos)
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--delay', `${Math.min(i * 0.08, 0.4)}s`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => observer.observe(el));
}

/* Submenú interno: resalta la sección que se está leyendo */
function initSubnav() {
  const links = document.querySelectorAll('.subnav a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map([...links].map((a) => [a.getAttribute('href').slice(1), a]));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-current'));
      const link = byId.get(entry.target.id);
      if (link) {
        link.classList.add('is-current');
        link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

/* Horario: marca el día de hoy e indica si la biblioteca está abierta.
   Cada fila lleva data-day (0=domingo … 6=sábado) y data-open/data-close en formato HH:MM. */
// Horario oficial: lunes a viernes, 8:00 a 16:00 (jornada continua)
const HORARIO = { dias: [1, 2, 3, 4, 5], abre: '08:00', cierra: '16:00' };

function initHours() {
  const table = document.querySelector('.hours');
  const status = document.getElementById('openStatus');
  if (!table && !status) return;

  // Hora de Colombia, sin importar la zona horaria del visitante
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const today = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  if (table) {
    const row = table.querySelector(`tr[data-day~="${today}"]`);
    if (row) row.classList.add('is-today');
  }
  if (!status) return;

  const open = HORARIO.dias.includes(today) && minutes >= toMin(HORARIO.abre) && minutes < toMin(HORARIO.cierra);
  status.textContent = open ? 'Abierto ahora · cierra a las 4:00 p. m.' : 'Cerrado en este momento · abrimos de lunes a viernes, 8:00 a. m.';
  status.classList.add(open ? 'status--open' : 'status--closed');
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Barra de progreso de lectura + botón "volver arriba" */
function initProgressAndTop() {
  const bar = document.getElementById('progress');
  const top = document.getElementById('toTop');
  if (!bar && !top) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.transform = `scaleX(${ratio})`;
    if (top) top.classList.toggle('is-visible', window.scrollY > 600);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* Palabra que rota en el título principal */
function initRotator() {
  const el = document.getElementById('rotator');
  if (!el || reduceMotion) return;
  const words = ['leer', 'aprender', 'imaginar', 'encontrarnos'];
  let i = 0;
  setInterval(() => {
    el.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.classList.remove('is-out');
    }, 350);
  }, 2600);
}

/* Cifras que cuentan desde 0 al aparecer en pantalla */
function initCounters() {
  const nums = document.querySelectorAll('[data-count]');
  if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;
  const run = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    const dur = 1400;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
}

/* Estante: leve inclinación 3D siguiendo el mouse */
function initShelfTilt() {
  const shelf = document.getElementById('shelf');
  if (!shelf || reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
  const wrap = shelf.parentElement;
  wrap.addEventListener('mousemove', (e) => {
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    shelf.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
  });
  wrap.addEventListener('mouseleave', () => { shelf.style.transform = ''; });
}

/* ===== Noticias y eventos (se leen de data/noticias.json) ===== */
const CATEGORIAS = {
  cultura:  { nombre: 'Cultura',  icono: '<path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>' },
  infantil: { nombre: 'Infantil', icono: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/>' },
  taller:   { nombre: 'Taller',   icono: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>' },
  club:     { nombre: 'Club de lectura', icono: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/>' },
  cine:     { nombre: 'Cine',     icono: '<path d="M3 5h18v14H3zM7 5v14M17 5v14M3 9.5h4M17 9.5h4M3 14.5h4M17 14.5h4"/>' },
  noticia:  { nombre: 'Noticia',  icono: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"/>' }
};
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function hoyBogota() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  d.setHours(0, 0, 0, 0);
  return d;
}
function parseFecha(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
function hora12(hhmm) {
  if (!hhmm) return '';
  let [h, m] = hhmm.split(':').map(Number);
  const suf = h >= 12 ? 'p. m.' : 'a. m.';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${suf}`;
}
function escapeHTML(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Etiqueta temporal: Hoy / Mañana / Esta semana / Próximamente */
function etiquetaTiempo(fecha, hoy) {
  const dias = Math.round((fecha - hoy) / 86400000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  const finSemana = new Date(hoy);
  finSemana.setDate(hoy.getDate() + ((7 - hoy.getDay()) % 7)); // hasta el domingo
  if (dias > 1 && fecha <= finSemana) return 'Esta semana';
  if (dias > 1 && dias <= 14) return 'Próximamente';
  return '';
}

function tarjetaNoticia(n, i, hoy) {
  const cat = CATEGORIAS[n.categoria] || CATEGORIAS.noticia;
  const f = parseFecha(n.fecha);
  const etiqueta = n.categoria === 'noticia' ? '' : etiquetaTiempo(f, hoy);
  const media = n.imagen
    ? `<img src="${escapeHTML(n.imagen)}" alt="" loading="lazy">`
    : `<svg viewBox="0 0 24 24" aria-hidden="true">${cat.icono}</svg>`;
  const meta = [
    `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}`,
    hora12(n.hora),
    n.lugar || ''
  ].filter(Boolean).map((t) => `<span>${escapeHTML(t)}</span>`).join('');

  return `
    <article class="news-card${n.destacado ? ' news-card--featured' : ''}" data-cat="${escapeHTML(n.categoria)}" style="--i:${i}">
      <div class="news-card__media">
        ${media}
        ${etiqueta ? `<span class="badge-week">${etiqueta}</span>` : ''}
        <time class="news-card__date" datetime="${escapeHTML(n.fecha)}"><b>${f.getDate()}</b><small>${MESES[f.getMonth()]}</small></time>
      </div>
      <div class="news-card__body">
        <span class="news-card__tag">${cat.nombre}</span>
        <h3 class="news-card__title">${escapeHTML(n.titulo)}</h3>
        <p class="news-card__text">${escapeHTML(n.resumen)}</p>
        <p class="news-card__meta">${meta}</p>
      </div>
    </article>`;
}

async function initNews() {
  const list = document.getElementById('newsList');
  if (!list) return;
  const filters = document.getElementById('newsFilters');
  const max = Number(list.dataset.max || 6);
  let items = [];

  try {
    items = await cargarNoticias();
  } catch (err) {
    list.innerHTML = '<p class="news__empty">No pudimos cargar las actividades en este momento. Consulta la <a href="agenda.html">agenda completa</a>.</p>';
    return;
  }

  const hoy = hoyBogota();
  // Eventos de hoy en adelante; noticias publicadas en los últimos 30 días
  items = items.filter((n) => {
    const f = parseFecha(n.fecha);
    return n.categoria === 'noticia' ? (hoy - f) / 86400000 <= 30 && f <= hoy : f >= hoy;
  });
  // Destacados primero y luego por fecha más cercana
  items.sort((a, b) => (Number(!!b.destacado) - Number(!!a.destacado)) || (parseFecha(a.fecha) - parseFecha(b.fecha)));

  const render = (filtro) => {
    const visibles = items.filter((n) => filtro === 'todas' || n.categoria === filtro).slice(0, max);
    list.innerHTML = visibles.length
      ? visibles.map((n, i) => tarjetaNoticia(n, i, hoy)).join('')
      : '<p class="news__empty">No hay actividades de este tipo programadas por ahora.</p>';
  };
  render('todas');

  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      filters.querySelectorAll('.chip').forEach((c) => {
        const on = c === btn;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      render(btn.dataset.filter);
    });
  }
}

/* Lee el archivo de noticias (una sola vez por página) */
let _noticiasCache = null;
function cargarNoticias() {
  if (!_noticiasCache) {
    _noticiasCache = fetch('data/noticias.json', { cache: 'no-cache' })
      .then((res) => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then((data) => data.noticias || []);
  }
  return _noticiasCache;
}

/* Activa un grupo de botones tipo filtro y avisa cuál quedó seleccionado */
function grupoBotones(contenedor, selector, atributo, alCambiar) {
  if (!contenedor) return;
  contenedor.addEventListener('click', (e) => {
    const btn = e.target.closest(selector);
    if (!btn) return;
    contenedor.querySelectorAll(selector).forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    alCambiar(btn.dataset[atributo]);
  });
}

const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ===== Agenda completa ===== */
async function initAgenda() {
  const list = document.getElementById('agendaList');
  if (!list) return;
  const count = document.getElementById('agendaCount');
  const input = document.getElementById('agendaQ');
  const estado = { periodo: 'proximos', filtro: 'todas', q: '' };
  let items = [];

  try {
    items = await cargarNoticias();
  } catch (err) {
    list.innerHTML = '<p class="news__empty">No pudimos cargar la agenda en este momento. Inténtalo más tarde.</p>';
    return;
  }
  const hoy = hoyBogota();

  const render = () => {
    const q = normalizar(estado.q);
    let visibles = items.filter((n) => {
      const f = parseFecha(n.fecha);
      const enPeriodo = estado.periodo === 'proximos' ? f >= hoy : f < hoy;
      const enFiltro = estado.filtro === 'todas' || n.categoria === estado.filtro;
      const enBusqueda = !q || normalizar(`${n.titulo} ${n.resumen} ${n.lugar}`).includes(q);
      return enPeriodo && enFiltro && enBusqueda;
    });
    visibles.sort((a, b) => (parseFecha(a.fecha) - parseFecha(b.fecha)) * (estado.periodo === 'proximos' ? 1 : -1));

    count.textContent = visibles.length === 1 ? '1 actividad' : `${visibles.length} actividades`;
    if (!visibles.length) {
      list.innerHTML = `<p class="news__empty">${estado.periodo === 'proximos'
        ? 'No hay actividades próximas con estos filtros. Prueba con "Todas" o revisa las anteriores.'
        : 'No hay actividades anteriores con estos filtros.'}</p>`;
      return;
    }

    // Agrupar por mes
    const grupos = new Map();
    visibles.forEach((n) => {
      const f = parseFecha(n.fecha);
      const clave = f.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(n);
    });

    let i = 0;
    list.innerHTML = [...grupos].map(([mes, eventos]) => `
      <section class="agenda-month" aria-label="${mes}">
        <h3 class="agenda-month__title">${mes}</h3>
        <ul class="agenda-list" role="list">
          ${eventos.map((n) => itemAgenda(n, i++, hoy)).join('')}
        </ul>
      </section>`).join('');
  };

  grupoBotones(document.querySelector('.segmented'), '.segmented__btn', 'periodo', (v) => { estado.periodo = v; render(); });
  grupoBotones(document.getElementById('agendaFilters'), '.chip', 'filter', (v) => { estado.filtro = v; render(); });
  let t;
  input?.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { estado.q = input.value; render(); }, 200); });

  // Botón "Agregar a mi calendario"
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.ics-btn');
    if (!btn) return;
    const n = items[Number(btn.dataset.idx)];
    if (n) descargarICS(n);
  });

  render();

  function itemAgenda(n, idx, hoy) {
    const cat = CATEGORIAS[n.categoria] || CATEGORIAS.noticia;
    const f = parseFecha(n.fecha);
    const pasado = f < hoy;
    const meta = [hora12(n.hora), n.lugar].filter(Boolean).map((t) => `<span>${escapeHTML(t)}</span>`).join('');
    const ics = !pasado && n.categoria !== 'noticia'
      ? `<button type="button" class="ics-btn" data-idx="${items.indexOf(n)}" aria-label="Agregar ${escapeHTML(n.titulo)} a mi calendario">
           <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18M7 3v4M17 3v4M12 13v5M9.5 15.5h5M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>
           Agregar al calendario</button>`
      : '';
    return `
      <li class="agenda-item${pasado ? ' is-past' : ''}" data-cat="${escapeHTML(n.categoria)}" style="--i:${idx}">
        <time class="agenda-item__date" datetime="${escapeHTML(n.fecha)}"><b>${f.getDate()}</b><small>${DIAS[f.getDay()].slice(0, 3)}</small></time>
        <div>
          <span class="news-card__tag">${cat.nombre}</span>
          <h4 class="agenda-item__title">${escapeHTML(n.titulo)}</h4>
          <p class="agenda-item__text">${escapeHTML(n.resumen)}</p>
          <p class="news-card__meta">${meta}</p>
        </div>
        ${ics}
      </li>`;
  }
}

/* Genera un archivo .ics para agregar el evento a Google Calendar, Outlook o el celular */
function descargarICS(n) {
  const fecha = n.fecha.replace(/-/g, '');
  const esc = (s = '') => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  let inicio, fin;
  if (n.hora) {
    const [h, m] = n.hora.split(':').map(Number);
    const hf = Math.min(h + 2, 23); // duración por defecto: 2 horas
    inicio = `DTSTART;TZID=America/Bogota:${fecha}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
    fin = `DTEND;TZID=America/Bogota:${fecha}T${String(hf).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  } else {
    const d = parseFecha(n.fecha); d.setDate(d.getDate() + 1);
    const sig = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    inicio = `DTSTART;VALUE=DATE:${fecha}`;
    fin = `DTEND;VALUE=DATE:${sig}`;
  }
  const ahora = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Biblioteca Meira Delmar//Agenda//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${fecha}-${normalizar(n.titulo).replace(/[^a-z0-9]+/g, '-')}@biblioteca-meira-delmar`,
    `DTSTAMP:${ahora}`, inicio, fin,
    `SUMMARY:${esc(n.titulo)}`,
    `DESCRIPTION:${esc(n.resumen)}`,
    `LOCATION:${esc(`${n.lugar ? n.lugar + ' - ' : ''}Biblioteca Meira Delmar, Calle 38 N.º 38B-21, Barranquilla`)}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${normalizar(n.titulo).replace(/[^a-z0-9]+/g, '-')}.ics` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ===== Formulario de contacto ===== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('formStatus');
  const btn = document.getElementById('enviarBtn');
  const tipo = form.tipo;
  const extra = document.getElementById('extraVisita');
  const mensaje = form.mensaje;
  const contador = document.getElementById('mensaje-count');

  form.inicio.value = Date.now();

  // Preseleccionar el tipo desde la URL (ej.: contacto.html?tipo=visita)
  const params = new URLSearchParams(location.search);
  if (params.get('tipo') && tipo.querySelector(`option[value="${CSS.escape(params.get('tipo'))}"]`)) tipo.value = params.get('tipo');
  if (params.get('enviado')) mostrarEstado('is-ok', '¡Gracias! Recibimos tu mensaje y te responderemos pronto.');
  if (params.get('error')) mostrarEstado('is-err', 'No pudimos enviar tu mensaje. Revisa los datos e inténtalo de nuevo.');

  const toggleExtra = () => { extra.hidden = tipo.value !== 'visita'; };
  tipo.addEventListener('change', toggleExtra);
  toggleExtra();

  const actualizarContador = () => {
    const n = mensaje.value.length;
    contador.textContent = `${n} / 1000`;
    contador.classList.toggle('is-near', n > 900);
  };
  mensaje.addEventListener('input', actualizarContador);
  actualizarContador();

  const MENSAJES = {
    nombre:   (el) => el.validity.valueMissing ? 'Escribe tu nombre.' : 'Escribe tu nombre completo (mínimo 3 letras).',
    correo:   (el) => el.validity.valueMissing ? 'Escribe tu correo electrónico.' : 'Revisa el correo; debe tener la forma nombre@dominio.com.',
    telefono: () => 'Escribe un teléfono válido (solo números, espacios, + o guiones).',
    tipo:     () => 'Selecciona el tipo de solicitud.',
    mensaje:  (el) => el.validity.valueMissing ? 'Escribe tu mensaje.' : 'Cuéntanos un poco más (mínimo 10 caracteres).',
    acepto:   () => 'Debes autorizar el tratamiento de datos para poder responderte.'
  };

  const validar = (el) => {
    const campo = el.closest('.field');
    const error = document.getElementById(`${el.name}-error`);
    if (!campo || !error) return true;
    const valido = el.checkValidity();
    campo.classList.toggle('is-invalid', !valido);
    campo.classList.toggle('is-valid', valido && el.type !== 'checkbox' && el.value !== '');
    el.setAttribute('aria-invalid', String(!valido));
    error.textContent = valido ? '' : MENSAJES[el.name](el);
    return valido;
  };

  const campos = ['nombre', 'correo', 'telefono', 'tipo', 'mensaje', 'acepto'].map((n) => form[n]);
  campos.forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.type === 'checkbox') validar(el); });
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('is-invalid')) validar(el); });
    el.addEventListener('change', () => validar(el));
  });

  function mostrarEstado(clase, texto, enfocar = true) {
    status.className = `form__status ${clase}`;
    status.textContent = texto;
    if (enfocar) status.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalidos = campos.filter((el) => !validar(el));
    if (invalidos.length) {
      // El aviso se anuncia por aria-live y el foco va al primer campo a corregir
      mostrarEstado('is-err', invalidos.length === 1 ? 'Revisa el campo marcado.' : `Revisa los ${invalidos.length} campos marcados.`, false);
      invalidos[0].focus();
      return;
    }

    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.querySelector('.btn__label').textContent = 'Enviando…';
    const esLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);

    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'fetch' } });
      const tipoResp = res.headers.get('content-type') || '';
      if (!tipoResp.includes('application/json')) throw new Error('sin-php');
      const data = await res.json();
      if (data.ok) {
        form.reset();
        form.inicio.value = Date.now();
        campos.forEach((el) => el.closest('.field')?.classList.remove('is-valid', 'is-invalid'));
        toggleExtra(); actualizarContador();
        mostrarEstado('is-ok', data.mensaje);
      } else {
        Object.entries(data.errores || {}).forEach(([nombre, texto]) => {
          const err = document.getElementById(`${nombre}-error`);
          if (err) { err.textContent = texto; err.closest('.field')?.classList.add('is-invalid'); }
        });
        mostrarEstado('is-err', data.mensaje);
      }
    } catch (err) {
      if (esLocal && err.message === 'sin-php') {
        mostrarEstado('is-info', 'Modo de prueba: el formulario es válido, pero este servidor local no ejecuta PHP, así que el mensaje no se envió. En el servidor de la Gobernación lo procesa enviar.php.');
      } else {
        mostrarEstado('is-err', 'No pudimos conectar con el servidor. Revisa tu conexión o escríbenos a atencionalciudadano@atlantico.gov.co.');
      }
    } finally {
      btn.disabled = false;
      btn.classList.remove('is-loading');
      btn.querySelector('.btn__label').textContent = 'Enviar mensaje';
    }
  });
}
