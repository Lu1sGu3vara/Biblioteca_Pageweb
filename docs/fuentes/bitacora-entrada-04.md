# Entrada 04 — 12/11/2026 · Fase 5: Funcionalidades (Contacto, Agenda, Catálogo y páginas legales)

> Para pegar en la Bitácora (Word). Sirve para el **Capítulo 5 – Desarrollo** y el **Capítulo 6 – Pruebas**.

Con esta entrada, el portal queda con **9 páginas completas** y sin enlaces rotos:

| Página | Archivo | Estado |
|---|---|---|
| Inicio | `index.html` | ✅ |
| La Biblioteca (historia) | `historia.html` | ✅ |
| Servicios | `servicios.html` | ✅ |
| Catálogo | `catalogo.html` | ✅ nueva |
| Agenda | `agenda.html` | ✅ nueva |
| Visítanos | `visitanos.html` | ✅ |
| Contacto | `contacto.html` + `enviar.php` | ✅ nueva |
| Política de tratamiento de datos | `politica-datos.html` | ✅ nueva (borrador legal) |
| Accesibilidad | `accesibilidad.html` | ✅ nueva |

---

## 1. Plantilla común y generador de páginas

**Problema:** todas las páginas repiten la barra gov.co, el menú y el pie de página. Copiarlos a mano en cada archivo es lento y produce errores.

**Solución:** un script en Python, `herramientas/generar-paginas.py`, que:
1. Toma el encabezado y el pie de una página modelo.
2. Le pega el contenido propio de cada página (guardado en `herramientas/contenido/`).
3. Ajusta automáticamente el título, la descripción para buscadores y el enlace activo del menú.

```
python herramientas/generar-paginas.py
```

**Justificación:** aplica el principio **DRY** (*Don't Repeat Yourself*). Cambiar el menú en un solo lugar actualiza todas las páginas generadas, y el sitio sigue siendo HTML estático, sin necesidad de un servidor especial.

---

## 2. Formulario de contacto (RF-06)

### Lado del visitante (`contacto.html` + JavaScript)
- **Campos:** nombre, correo, teléfono (opcional), tipo de solicitud y mensaje.
- **Tipos de solicitud:** consulta general, visita guiada, afiliación a la Llave del Saber, donación de libros, inscripción a una actividad y sugerencia.
- **Campos dinámicos:** al elegir "Visita guiada" aparecen *Institución* y *Número de personas*.
- **Enlaces que llegan con el tipo ya elegido:** por ejemplo, "Solicitar visita guiada" abre `contacto.html?tipo=visita`. Lo mismo pasa con las donaciones, las inscripciones y las sugerencias.
- **Validación en tiempo real** con mensajes claros en español, como "Revisa el correo; debe tener la forma nombre@dominio.com".
- **Contador de caracteres** del mensaje (máximo 1.000).
- **Consentimiento obligatorio** según la Ley 1581 de 2012, con enlace a la política de datos.
- **Accesibilidad:**
  - Cada campo tiene su etiqueta visible.
  - Los errores están ligados al campo (`aria-describedby` y `aria-invalid`).
  - El aviso general se anuncia a los lectores de pantalla (`aria-live`).
  - El foco va al primer campo que hay que corregir.
- Distingue entre **PQRSD** (que tienen un trámite oficial con radicado) y una consulta simple, y remite al canal oficial de la Gobernación.

### Lado del servidor (`enviar.php`)
| Medida | Para qué |
|---|---|
| Revalidación de todos los campos | Nunca se confía solo en el navegador |
| **Honeypot** (campo oculto trampa) | Los bots lo llenan; a ellos se les finge éxito y el mensaje se descarta |
| **Tiempo mínimo** de llenado (3 s) | Bloquea envíos automáticos instantáneos |
| **Límite de 5 envíos por IP por hora** | Evita abuso y saturación del correo |
| Limpieza de saltos de línea y etiquetas | Previene la **inyección de cabeceras** de correo y de HTML |
| Respuesta en JSON | El formulario muestra el resultado sin recargar la página |

> **Configuración pendiente:** en `enviar.php` hay que cambiar `DESTINO` por el correo propio de la biblioteca y confirmar que el servidor de la Gobernación tenga PHP y la función `mail()` habilitados.

---

## 3. Agenda completa (`agenda.html`)

Usa el **mismo archivo `data/noticias.json`** que el inicio, así que un evento se publica una sola vez y aparece en los dos lugares.

- Pestañas **Próximas** y **Anteriores** (historial de actividades).
- Eventos **agrupados por mes**.
- **Filtros** por categoría.
- **Buscador** que ignora las tildes: "poesia" encuentra "poesía".
- Botón **"Agregar al calendario"**: genera un archivo `.ics` estándar que se abre en Google Calendar, Outlook o el celular, con la fecha, la hora (zona America/Bogotá), el lugar y la descripción.

---

## 4. Catálogo (`catalogo.html`) — integración con Koha

- Buscador grande con selector **Todo / Título / Autor / Tema**, que corresponde a los índices de Koha `kw`, `ti`, `au` y `su`.
- La búsqueda se abre en el **OPAC oficial de Koha** de la biblioteca, que muestra la disponibilidad y la ubicación del libro.
- Búsquedas populares de un clic (Meira Delmar, García Márquez, Historia del Atlántico, Literatura infantil).
- Accesos a las colecciones digitales: biblioteca digital (DSpace), libros electrónicos y ADN Cultural.
- Guía de 3 pasos para encontrar un libro: buscar, revisar la disponibilidad y anotar la signatura.

---

## 5. Páginas legales
- **Política de tratamiento de datos:** responsable, datos que se recogen, finalidad, derechos del titular y plazos de respuesta (10 días hábiles para consultas y 15 para reclamos). Está marcada como **borrador** para que la reemplace o valide la oficina jurídica de la Gobernación.
- **Declaración de accesibilidad:** compromiso con WCAG 2.1 AA (Resolución 1519 de 2020), las medidas implementadas y un canal para reportar barreras.

---

## 6. Pruebas realizadas (Capítulo 6)

| # | Prueba | Resultado |
|---|---|---|
| P-01 | Enviar el formulario vacío | ✅ Marca 4 campos obligatorios y lleva el foco al primero |
| P-02 | Correo con formato inválido (`ana@`) | ✅ Muestra el mensaje de error específico |
| P-03 | Abrir `contacto.html?tipo=visita` | ✅ Preselecciona "Visita guiada" y muestra los campos extra |
| P-04 | Enviar el formulario válido en el servidor local (sin PHP) | ✅ Avisa claramente que está en "modo de prueba", sin fingir el envío |
| P-05 | Agenda: próximas actividades | ✅ 6 actividades agrupadas en noviembre de 2026 |
| P-06 | Agenda: anteriores | ✅ 2 actividades, de la más reciente a la más antigua |
| P-07 | Agenda: filtro "Infantil" | ✅ 1 actividad |
| P-08 | Agenda: buscar "poesia" sin tilde | ✅ Encuentra "Club de lectura: poesía del Caribe" |
| P-09 | Descargar el evento `.ics` | ✅ Archivo válido con zona horaria America/Bogotá y duración de 2 h |
| P-10 | Catálogo: buscar autor "Meira Delmar" | ✅ El Koha real devuelve **6 resultados** (p. ej. *Alguien pasa*, *Raíz antigua y otros poemas*) |
| P-11 | Enlaces internos en las 9 páginas | ✅ Ninguno roto |
| P-12 | Las 9 páginas a 375 px (celular) | ✅ Sin desplazamiento horizontal, después de corregir dos desbordes en Visítanos (horario y correo largo) |
| P-13 | Consola del navegador | ✅ Sin errores de JavaScript. El único aviso es el 501 esperado del servidor local, que no acepta POST |

**Errores encontrados y corregidos durante las pruebas** (útil para mostrar el proceso de depuración):
1. Al enviar con errores, el foco iba al mensaje general y no al campo que había que corregir. Se cambió para cumplir mejor con WCAG.
2. En celular, el horario de Visítanos no se ajustaba al ancho. Se permitió el salto de línea solo en pantallas pequeñas.
3. En celular, el correo largo de la lista de contacto desbordaba la pantalla. Se permitió partir la palabra.

### No probado todavía
- El envío real del correo con `enviar.php` necesita un servidor con PHP. Se probará en el hosting de la Gobernación.
- El mapa de Google en Visítanos no se vio cargado en la vista previa de desarrollo.

## Evidencias sugeridas (capturas para el Word)
1. Formulario con un error marcado en rojo y los campos de visita guiada visibles.
2. Mensaje de "modo de prueba" después de un envío válido.
3. Agenda con los filtros y un mes agrupado.
4. El archivo `.ics` abierto en el calendario del celular o de Outlook.
5. Catálogo: el buscador y la página de resultados de Koha con las obras de Meira Delmar.
6. Fragmento de `enviar.php` con las medidas de seguridad, para el anexo de código.

## Pendientes
- [ ] Correo de destino oficial para `enviar.php` y prueba en el servidor de la Gobernación.
- [ ] Política de datos oficial de la Gobernación.
- [ ] Fotografías oficiales y logo.
- [ ] Próxima fase: pruebas formales de **rendimiento y accesibilidad** (Lighthouse, WAVE) y **guía de integración** con el sitio de la Gobernación (el botón "Biblioteca Departamental").
