# Entrada 06 — 12/11/2026 · Identidad: logo oficial de la biblioteca e imágenes locales

> Para la Bitácora (Word). Sirve para el **Capítulo 4 – Diseño (identidad visual)**.

## 1. Imágenes e ícono del sitio

**Problema reportado:** en el navegador del usuario no aparecían algunas imágenes y la pestaña mostraba un ícono genérico (un globo).

**Causa:** la foto de la fachada y los logos gov.co y de Colombia se cargaban directamente desde el servidor de atlantico.gov.co. Algunos servidores bloquean que otros sitios usen sus imágenes (*hotlinking*) y además el sitio no tenía un ícono propio.

**Solución:**
- Se guardaron copias locales en `sitio/img/`: la fachada (1600 × 1066), el logo gov.co y el logo de Colombia. El logo de Colombia se redujo de 2090 px y 158 KB a 96 px y 10 KB, porque se muestra muy pequeño.
- Ninguna página depende ya de servidores externos para sus imágenes.
- Se agregó la foto de la fachada, con su pie de foto, en la sección "El edificio" de la página La Biblioteca.

## 2. Logo oficial de la biblioteca

La entidad entregó el logo oficial: el símbolo **"BPD"** formado por libros en azul, rosado, naranja y verde, con el texto *Biblioteca Pública Departamental Meira Delmar* en blanco sobre fondo morado (`#783C96`).

**Tratamiento de la imagen** (con Python y la librería Pillow):
1. **Se quitó el fondo morado.** Para cada píxel se calcula qué tan distinto es del morado y se le asigna una transparencia proporcional.
2. **Se limpiaron los bordes.** Se "des-mezcla" el morado de los bordes suavizados para que el logo no deje un halo morado sobre fondos claros.
3. Se generaron estas versiones, guardadas en `sitio/img/marca/`:

| Archivo | Uso |
|---|---|
| `logo-simbolo.png` | Símbolo solo, con fondo transparente, para el encabezado |
| `logo-completo-blanco.png` | Símbolo y texto blanco, para fondos oscuros (pie de página) |
| `favicon.ico` y `favicon-32.png` | Ícono de la pestaña del navegador |
| `apple-touch-icon.png` | Ícono al guardar el sitio en la pantalla de inicio del celular (fondo morado de la marca) |
| `logo-original-morado.png` | Archivo original entregado, como respaldo |

## 3. Dónde se colocó y por qué

| Lugar | Versión | Justificación |
|---|---|---|
| **Encabezado** (las 9 páginas) | Símbolo + "Biblioteca Meira Delmar / Gobernación del Atlántico", separados por una línea fina | Es lo primero que se ve. El símbolo de colores destaca tanto sobre el fondo claro como sobre la foto de la portada |
| **Pie de página** | Logo completo en blanco | El pie es oscuro, así que el logo se ve con su texto completo, como en el original |
| **Pestaña del navegador** | Símbolo | Identifica la biblioteca entre otras pestañas |
| **Celular** | Símbolo de 34 px y nombre en una sola línea | Cabe en pantallas desde 360 px sin desbordarse |

**Detalle de interacción:** el símbolo se inclina levemente al pasar el mouse sobre el logo.

**Equilibrio entre marcas:**
- La **barra roja gov.co** sigue identificando a la Gobernación del Atlántico (marca institucional).
- El **logo de colores** identifica a la biblioteca (marca propia).
- El **rojo institucional** sigue siendo el color de las acciones: botones y enlaces.

## 4. Pruebas
| # | Prueba | Resultado |
|---|---|---|
| P-21 | Logo en el encabezado: portada transparente y encabezado sólido al bajar | ✅ Visible en ambos estados |
| P-22 | Logo completo en el pie oscuro | ✅ |
| P-23 | Ícono de la pestaña | ✅ Las 9 páginas apuntan a `img/marca/favicon.ico` |
| P-24 | Encabezado en celular de 360 px | ✅ Nombre en una línea, sin desbordes |
| P-25 | Recorte del logo sobre fondo claro y oscuro | ✅ Sin halo morado |

## Pendientes
- [ ] Pedir el logo en **formato vectorial (SVG, AI o PDF)**. El archivo entregado mide 574 × 348 px: sirve en pantalla, pero no da para impresión o tamaños grandes.
- [ ] Confirmar con la entidad el código exacto de los colores de la marca.
