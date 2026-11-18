# Entrada 11 — 18/11/2026 · Panel de opciones de accesibilidad

> Sirve para el Capítulo 4 (Diseño), el Capítulo 5 (Desarrollo) y el Capítulo 6 (Pruebas).

## 1. Requerimiento

Incorporar en todas las páginas el mismo panel de **opciones de accesibilidad** que ofrece el portal de la Gobernación del Atlántico: un botón azul con el símbolo internacional de accesibilidad que abre once herramientas.

## 2. Funciones implementadas

| Herramienta | Funcionamiento |
|---|---|
| Aumentar el tamaño del texto | Hasta 150 %, en pasos de 10 % |
| Disminuir el tamaño del texto | Hasta 80 % |
| Aumentar el espaciado del texto | Cuatro niveles: separación entre letras, palabras y líneas |
| Disminuir el espaciado del texto | Vuelve hacia el espaciado normal |
| Invertir colores | Fondo oscuro y texto claro; las fotografías, banderas y mapas se vuelven a invertir para conservar sus colores naturales |
| Tonos grises | Elimina el color de toda la página; se puede combinar con la inversión |
| Subrayar enlaces | Subraya todos los enlaces para no depender del color |
| Cursor grande | Flecha y mano de 44 px con borde blanco, visibles sobre cualquier fondo |
| Guía de lectura | Franja libre que sigue al puntero; el resto de la página se oscurece |
| Texto a voz | Lee en voz alta (voz en español de Colombia o la más cercana) el texto que se señala con el mouse, se enfoca con el teclado o se selecciona; resalta lo que está leyendo |
| Voz a texto | Dicta en el campo enfocado del formulario o recibe órdenes: «ir a servicios», «bajar», «subir», «buscar Meira Delmar» (busca en el catálogo Koha) |

También tiene un botón para **restablecer** todas las opciones y otro para **cerrar** el panel.

## 3. Decisiones técnicas

- **Archivo propio:** `js/accesibilidad.js`, separado del resto del código.
- **Preferencias persistentes:** se guardan en el navegador del visitante (`localStorage`) y se aplican en todas las páginas del portal. Si el navegador está en modo privado, las opciones funcionan durante la visita.
- **Sin parpadeo:** una instrucción mínima en el `<head>` aplica las preferencias guardadas antes de dibujar la página. Quien usa letra grande nunca ve la página en tamaño normal por un instante.
- **Tamaño del texto en todo el sitio:** los títulos usan tamaños que dependen del ancho de la pantalla (`vw`). Se ajustaron 14 declaraciones para que también crezcan con la escala del visitante.
- **El panel no cambia de tamaño:** sus medidas están en píxeles, para que la herramienta siga siendo cómoda aunque el texto de la página esté al 150 %.
- **Carga diferida:** el botón viene escrito en el HTML; el panel se construye la primera vez que se abre.
- **Accesibilidad del propio panel:**
  - Las opciones de activar y desactivar anuncian su estado (`aria-pressed`).
  - Un mensaje en vivo informa cada cambio, por ejemplo «Tamaño del texto: 120 %».
  - El foco queda dentro del panel mientras está abierto y la tecla Escape lo cierra.
- **Compatibilidad:** si el navegador no permite la lectura en voz alta o el dictado (por ejemplo, Firefox no tiene reconocimiento de voz), la opción aparece desactivada con una explicación.
- **Ubicación:** a la izquierda, centrado verticalmente, en escritorio; abajo a la izquierda en el celular, donde el panel se abre como una hoja a lo ancho de la pantalla. No choca con el botón "volver arriba", que está a la derecha.

## 4. Pruebas

| N.º | Prueba | Resultado |
|---|---|---|
| P-63 | El panel abre con las 11 opciones y el foco va a la primera | Correcto |
| P-64 | Tamaño del texto al 120 % | Título 73,6 → 88,3 px; párrafo 20 → 24 px; título de sección 40 → 48 px |
| P-65 | Espaciado nivel 2 | Separación entre letras de 1,2 px y entre palabras de 4,9 px |
| P-66 | Invertir colores | Página invertida, foto de la fachada con sus colores naturales |
| P-67 | Invertir más tonos grises | Ambos filtros combinados |
| P-68 | Subrayar enlaces | Menú y enlaces subrayados |
| P-69 | Guía de lectura | La franja sigue al puntero |
| P-70 | Texto a voz con el mouse | Lee «Más de cien años abriendo las puertas…» en es-CO y resalta el párrafo |
| P-71 | Texto a voz con el teclado | Al enfocar el enlace lee «Servicios» |
| P-72 | Recargar la página | Las preferencias se mantienen sin parpadeo |
| P-73 | Elementos fijos con colores invertidos | El botón y el encabezado siguen en su lugar al desplazarse |
| P-74 | Celular de 375 px | El panel se abre como hoja inferior, sin desbordes |
| P-75 | Lighthouse con el panel (inicio y contacto) | Accesibilidad 100 y buenas prácticas 100 |

## 5. Nota

El dictado por voz usa el servicio de reconocimiento del navegador y solicita permiso para usar el micrófono la primera vez. La lectura en voz alta usa las voces instaladas en el equipo del visitante.
