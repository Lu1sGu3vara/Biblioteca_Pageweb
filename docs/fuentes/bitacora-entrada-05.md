# Entrada 05 — 12/11/2026 · Fase 4 (iteración): Rediseño inmersivo "Art déco del Caribe"

> Para pegar en la Bitácora (Word). Sirve para el **Capítulo 3 (Análisis del sitio actual)** y el **Capítulo 4 (Diseño)**.

## 1. Análisis de la página actual de la biblioteca

Se revisó la página que la Gobernación tiene hoy para la biblioteca: `atlantico.gov.co/index.php/biblioteca-publica-dptal`.

| Aspecto | Página actual | Portal propuesto |
|---|---|---|
| Contenido | Un bloque de texto con la historia y una sola foto | 9 páginas organizadas por necesidad del visitante |
| Navegación | Enlaces sueltos a sub-páginas, Koha y biblioteca digital | Menú fijo, tarjetas guiadas, migas de pan y submenús |
| Catálogo | Enlace externo a Koha | Buscador integrado en el inicio y en Catálogo, con filtros por título, autor y tema |
| Eventos | No hay | Noticias semanales y agenda con filtros |
| Contacto | Solo canales generales de la Gobernación | Formulario por tipo de solicitud |
| Experiencia visual | Plantilla genérica de Joomla | Diseño propio con identidad de la biblioteca |

**Identidad institucional detectada:** la barra gov.co del sitio de la Gobernación usa el **rojo `#D31A2B`**, con el logo gov.co, el logo de Colombia y el texto "Gobernación del Atlántico", arriba y en el pie.

## 2. Cambio solicitado
1. Que la barra gov.co sea **roja**, igual a la de la Gobernación.
2. Un estilo **más inmersivo y de mayor calidad** que capte el interés del visitante y sea aceptado por la Gobernación.

## 3. Concepto visual: "Art déco del Caribe"

**Hallazgo clave:** la foto oficial muestra el edificio de 1945, una fachada **art déco blanca con toldos rojos**. Esos toldos coinciden con el rojo institucional, así que **el propio edificio une la marca de la Gobernación con la identidad de la biblioteca**. Ese se convirtió en el concepto de diseño.

| Elemento de la fachada | Cómo se usa en el portal |
|---|---|
| Fachada blanca con toldos rojos | Foto de portada a pantalla completa |
| Franjas verticales de las ventanas | Patrón de líneas en la portada y en las cabeceras internas |
| Geometría art déco (rombos, simetría) | Rombo antes de cada título de sección y ornamento central bajo los títulos |
| Los tres pisos del edificio | Sección interactiva "Recorre la biblioteca" |
| Toldos rojos | Los "pisos" del recorrido llevan toldos rojos dibujados en CSS |

## 4. Cambios realizados

### Barra gov.co (las 9 páginas)
- Fondo rojo `#D31A2B`, igual al de la Gobernación.
- Logo oficial de gov.co, separador y el texto "Gobernación del Atlántico".
- En el pie: logo gov.co, logo de Colombia y el nombre de la entidad.
- En celular se oculta el texto largo y quedan el logo y el enlace "Volver al portal".

### Portada inmersiva (inicio)
| Mejora | Detalle técnico | Propósito |
|---|---|---|
| Foto de la fachada a pantalla completa | `object-fit: cover` y un velo de degradado cálido para que el texto se lea | Primera impresión fuerte y real |
| Zoom lento al cargar | Animación CSS de 18 s (efecto Ken Burns) | Sensación de entrar al edificio |
| Profundidad al bajar (parallax) | La foto se mueve al 30 % de la velocidad del scroll | Inmersión |
| Partículas de polvo con luz cálida | Animación en `<canvas>` que se pausa cuando no está en pantalla | Atmósfera de biblioteca antigua sin perder rendimiento |
| Encabezado transparente sobre la foto | Pasa a sólido al bajar | Portada limpia; la navegación sigue disponible |
| Buscador de "vidrio esmerilado" | `backdrop-filter: blur` | Estética moderna que no tapa la foto |
| Indicador "Descubre" con un mouse animado | Invita a bajar | Guía al visitante |
| Cifras superpuestas al borde de la portada | Tarjeta flotante con sombra | Profundidad y transición entre secciones |

### Recorrido por pisos (nuevo)
- Un corte del edificio con 3 pisos y la plazoleta. Cada piso es un botón.
- Al elegir un piso, se ilumina, sus ventanas se encienden y aparecen sus espacios.
- **Accesible:** usa la estructura de pestañas de WAI-ARIA (`tablist`, `tab`, `tabpanel`) y se maneja con las flechas del teclado, Inicio y Fin.

### Páginas internas
- Cabeceras con franjas art déco y una línea inferior roja y madera.
- Rombo art déco en todos los subtítulos de sección.

## 5. Accesibilidad y rendimiento
- Si el usuario tiene activada la opción "reducir movimiento", se desactivan el zoom, el parallax, las partículas y las animaciones.
- Las partículas solo se dibujan cuando la portada está visible (`IntersectionObserver`), para ahorrar batería.
- En celular, el velo de la foto es más oscuro para que el texto conserve el contraste.

## 6. Pruebas
| # | Prueba | Resultado |
|---|---|---|
| P-14 | Barra roja en las 9 páginas (arriba y abajo) | ✅ |
| P-15 | Portada en escritorio: foto, encabezado transparente y lectura del texto | ✅ |
| P-16 | El encabezado pasa a sólido al bajar | ✅ |
| P-17 | Recorrido: clic en "Segundo piso" | ✅ Muestra Museo, Hemeroteca, Internet y Audiovisual |
| P-18 | Recorrido: flecha abajo desde el segundo piso | ✅ Pasa al primer piso y mueve el foco |
| P-19 | Las 9 páginas a 375 px | ✅ Sin desplazamiento horizontal |
| P-20 | Consola | ✅ Sin errores de JavaScript (solo el 501 esperado del servidor local) |

## 7. Pendientes derivados
- [ ] **Fotografía:** la portada usa la foto publicada en atlantico.gov.co, enlazada directamente desde su servidor. Hay que pedir a la entidad una **versión en alta resolución con autorización de uso** y guardarla en `sitio/img/fachada.jpg`.
- [ ] **Logos gov.co y Colombia:** hoy se cargan desde el servidor de la Gobernación. Al publicar en su hosting, conviene tener copias locales.
- [ ] Más fotos (salas, museo, eventos) para usarlas en el recorrido y en las noticias.

## Evidencias sugeridas (capturas para el Word)
1. Antes y después: la página actual de la Gobernación junto a la portada nueva.
2. La barra roja con el logo gov.co.
3. El recorrido por pisos con el segundo piso seleccionado.
4. La portada en celular.
