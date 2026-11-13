# Entrada 08 — 13/11/2026 · Selector de idiomas, portada estable, ajustes técnicos y formato APA

> Sirve para el Capítulo 4 (Diseño), el Capítulo 5 (Desarrollo) y el Capítulo 6 (Pruebas).

## 1. Selector de idiomas

### Requerimiento
Permitir que el visitante vea el portal en otro idioma, con las mismas banderas del portal de la Gobernación del Atlántico: Estados Unidos, Taiwán, Francia, Alemania, Italia, Brasil y Colombia. El selector debía integrarse al diseño y no verse genérico.

### Solución
Se usa el traductor de Google, el mismo servicio que emplea el sitio de la Gobernación, pero con una interfaz propia. Traducir manualmente nueve páginas a seis idiomas no es viable para la entidad, y el traductor también traduce las noticias que se cargan de forma dinámica.

| Idioma | Código | Bandera |
|---|---|---|
| English | en | Estados Unidos |
| 中文（台灣） | zh-TW | Taiwán |
| Français | fr | Francia |
| Deutsch | de | Alemania |
| Italiano | it | Italia |
| Português | pt | Brasil |
| Español | es | Colombia |

### Decisiones de diseño
- El botón está en la barra roja gov.co. Muestra la bandera y el código del idioma actual.
- Al pulsarlo se abre un panel con las siete banderas, el nombre de cada idioma escrito en ese idioma y el país debajo. El idioma activo se marca con una línea roja y un visto.
- Las banderas están dibujadas en SVG, porque Windows no muestra los emojis de banderas.
- Se ocultan la barra superior y los globos emergentes de Google para que el sitio conserve su identidad.
- El panel aclara: "Traducción automática de Google. El texto oficial es el español."

### Decisiones técnicas
- **Carga diferida:** el script de Google solo se descarga cuando el visitante elige un idioma distinto al español. Quien navega en español no hace ninguna petición a Google, lo que protege su privacidad y acelera la carga.
- **Memoria de la elección:** el idioma se guarda en la cookie `googtrans` y se aplica al visitar otras páginas.
- **Nombres propios protegidos:** la marca "Biblioteca Meira Delmar" y "Gobernación del Atlántico" no se traducen (clase `notranslate`).
- **Título de la portada traducido a mano:** el traductor convertía cada palabra por separado y producía frases incorrectas como "A place for imagine". Ahora el título tiene una traducción revisada para cada idioma, por ejemplo "A place to read / learn / imagine / come together".
- **Accesibilidad:** el selector se maneja con el teclado (flechas, Inicio, Fin y Escape) y anuncia el idioma actual a los lectores de pantalla.
- El código está en un archivo propio, `js/idiomas.js`, separado del resto.

## 2. Portada sin saltos

**Problema:** las palabras que rotan ("leer", "aprender", "imaginar", "encontrarnos") tienen distinto largo. Al cambiar empujaban el texto y producían un salto brusco.

**Solución:**
- "Un lugar para" queda siempre en su propia línea, arriba.
- Las cuatro palabras se apilan en la misma celda de una grilla. El bloque mide lo de la palabra más larga y solo cambia cuál es visible, con un desvanecido suave.
- La animación se pausa mientras la pestaña está en segundo plano.
- Se oscureció el velo del lado del texto para que el letrero del edificio no compita con el título.

## 3. Ajustes técnicos

| Ajuste | Detalle | Beneficio |
|---|---|---|
| Imágenes WebP adaptables | Foto de la fachada en WebP de 960 px (73 KB) y 1600 px (177 KB), con respaldo JPEG | La portada pasa de 430 KB a 73–177 KB según la pantalla |
| Precarga de la portada | La foto principal se pide desde el inicio | La portada aparece antes |
| Etiquetas Open Graph | Título y descripción por página | Vista previa correcta al compartir en WhatsApp o Facebook |
| Datos estructurados schema.org | Tipo `Library` con dirección, horario, fundación y entidad | Google puede mostrar la ficha de la biblioteca |
| Página 404 | "Este libro no está en el estante", con accesos al inicio, al catálogo y al contacto | Evita que el visitante quede sin salida |
| `.htaccess` | Compresión, caché, cabeceras de seguridad, política de seguridad de contenido y página 404 | Más velocidad y seguridad en servidores Apache |
| `robots.txt` | Permite indexar el sitio, excepto `enviar.php` | Buen comportamiento ante buscadores |
| Menú en pantallas medianas | Los enlaces no se parten y se compactan entre 961 y 1180 px | Evita que el menú se apriete con idiomas más largos |

## 4. Documentos en formato APA 7

Los documentos Word se pasaron a la presentación de un trabajo académico, sin colores ni adornos:

- Times New Roman 12 en negro, doble espacio y márgenes de 2,54 cm.
- Párrafos alineados a la izquierda, con sangría de primera línea de 1,27 cm.
- Títulos por niveles APA: el nivel 1 va centrado y en negrita; el nivel 2, a la izquierda y en negrita; el nivel 3, a la izquierda, en negrita y cursiva.
- Tablas sin líneas verticales, numeradas como "Tabla 1" y con título en cursiva.
- Número de página arriba a la derecha.
- Referencias en orden alfabético y con sangría francesa.
- Los símbolos visuales se cambiaron por palabras ("Sí", "No", "Parcial", "Pendiente").

## 5. Pruebas

| N.º | Prueba | Resultado |
|---|---|---|
| P-34 | Altura del título al rotar las cuatro palabras | Constante (160 px) y el párrafo no se mueve |
| P-35 | Navegar en español | No se carga ningún script de Google |
| P-36 | Cambiar a inglés | Título "A place to…", menú "Start, The Library, Services…", barra de Google oculta |
| P-37 | Recargar con inglés guardado | La página vuelve a traducirse sola |
| P-38 | Cambiar a chino de Taiwán | Título "在這裡 / 閱讀…", menú traducido |
| P-39 | Volver a español | Texto original, sin cookie y sin script de Google |
| P-40 | Selector en celular de 360 px | Panel a lo ancho, sin desbordes |
| P-41 | Palabra más larga del título en celular | 257 px de 320 disponibles |
| P-42 | Imagen de portada servida | WebP de 1600 px en escritorio |
| P-43 | Página 404 | Se muestra con encabezado y pie del sitio |
| P-44 | Documentos en Word | Formato APA verificado: títulos, tablas, encabezado y referencias |

## Pendientes

- Probar la traducción en el servidor definitivo, porque la política de seguridad del `.htaccess` debe permitir los dominios de Google.
- Las etiquetas Open Graph no incluyen imagen: requieren la dirección definitiva del sitio (por ejemplo, `https://biblioteca.atlantico.gov.co/img/fachada.jpg`).
- La regla `ErrorDocument 404 /404.html` supone que el sitio se publica en la raíz del dominio.
