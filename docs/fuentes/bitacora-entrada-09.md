# Entrada 09 — 13/11/2026 · Auditoría de calidad con Lighthouse

> Sirve para el Capítulo 6 (Pruebas y resultados).

## 1. Herramienta y método

Se usó **Google Lighthouse 12.8.2**, la herramienta de Google que evalúa sitios web de 0 a 100 en cuatro categorías: rendimiento, accesibilidad, buenas prácticas y SEO (posicionamiento en buscadores). Se instaló Node.js 26.13.1 LTS para ejecutarla desde la línea de comandos sobre Google Chrome.

**Condiciones de la medición:**
- Seis páginas en modo **celular**, que es el modo que Google usa por defecto. Lighthouse simula una red 4G lenta y un procesador 4 veces más lento que el de un computador.
- La página de inicio también en modo **escritorio**.
- Servidor local de pruebas. Este servidor no comprime archivos ni configura la caché; esas funciones las cumple el archivo `.htaccess` en el servidor definitivo, así que los resultados en producción deberían ser iguales o mejores.

## 2. Resultados iniciales

Accesibilidad, buenas prácticas y SEO obtuvieron **100/100 en las siete mediciones**. El rendimiento estuvo entre 83 y 96.

### Hallazgos de rendimiento

| Hallazgo | Impacto | Causa |
|---|---|---|
| Recursos que bloquean el dibujo de la página | Hasta 1,9 s de espera | Las fuentes se descargaban desde Google Fonts antes de mostrar el texto |
| Imágenes más grandes de lo necesario | 18 KB | El símbolo del logo (142 px) se mostraba a 60 px; el logo de Colombia (96 px) a 26 px |
| Imágenes fuera de pantalla | 10 KB | Los logos del pie se descargaban al inicio |
| Tiempo de bloqueo (aparecido tras la primera corrección) | Hasta 450 ms | Varias funciones medían la página al mismo tiempo durante la carga y el selector de idiomas se construía completo |

## 3. Correcciones aplicadas

1. **Fuentes alojadas en el propio sitio.** Lora e Inter se guardaron en la carpeta `fuentes/` como tres archivos variables con solo los caracteres latinos (109 KB en total) y se precargan. Esto elimina el bloqueo y, además, el sitio ya no se conecta a Google al cargar, lo que mejora la privacidad del visitante.
2. **Logos optimizados.** El símbolo pasó a WebP de 120 px (de 15 KB a 8 KB) y el logo de Colombia a 52 px (de 10 KB a 5 KB). Los logos del pie se cargan solo al acercarse.
3. **Carga en dos tiempos.** Al cargar solo se ejecuta lo imprescindible: el menú, la aparición del contenido, el título y la descarga de noticias. Lo demás (sombra del encabezado, barra de progreso, contadores, recorrido por pisos, horario) se ejecuta en el primer momento libre del navegador (`requestIdleCallback`). Las partículas de la portada arrancan cuando la página terminó de cargar.
4. **Selector de idiomas diferido.** El botón viene escrito en el HTML. El panel con las siete banderas se construye solo la primera vez que alguien lo abre.
5. **Dibujo diferido de secciones.** Las secciones que están fuera de la pantalla no se dibujan hasta que el visitante se acerca (`content-visibility: auto`).
6. **Política de seguridad actualizada.** El `.htaccess` ya no permite Google Fonts, porque las fuentes son propias, y las guarda en caché por un año.

## 4. Resultados finales

### Rendimiento antes y después (modo celular)

| Página | Antes | Después | Primer dibujo antes | Primer dibujo después |
|---|---|---|---|---|
| Inicio | 83 | 89 | 3,3 s | 1,9 s |
| La Biblioteca | 87 | 97 | 3,1 s | 1,6 s |
| Servicios | 89 | 97 | 3,0 s | 1,6 s |
| Agenda | 90 | 96 | 2,9 s | 1,6 s |
| Catálogo | 90 | 97 | 2,9 s | 1,7 s |
| Contacto | 90 | 92 | 2,9 s | 1,8 s |
| **Promedio** | **88,2** | **94,7** | **3,0 s** | **1,7 s** |

### Inicio en modo escritorio

| Métrica | Antes | Después |
|---|---|---|
| Rendimiento | 96 | 99 |
| Primer dibujo con contenido | 1,0 s | 0,3 s |
| Elemento más grande dibujado | 1,1 s | 0,8 s |
| Tiempo de bloqueo | 0 ms | 0 ms |

### Las cuatro categorías después de las correcciones

| Categoría | Resultado en las 7 mediciones |
|---|---|
| Rendimiento | Entre 89 y 99 |
| Accesibilidad | 100 |
| Buenas prácticas | 100 |
| SEO | 100 |

**Estabilidad visual:** el desplazamiento acumulado del diseño (CLS) se mantuvo entre 0 y 0,006. Google considera bueno un valor menor a 0,1. Esto confirma que la corrección del título de la portada eliminó los saltos.

## 5. Observaciones

- Los puntajes de rendimiento varían unos ±3 puntos entre mediciones, por la simulación de red y procesador.
- Lighthouse todavía sugiere comprimir y minificar los archivos y configurar la caché. En el servidor definitivo eso lo resuelve el `.htaccess` con la compresión `mod_deflate` y la caché `mod_expires`. Minificar el CSS y el JavaScript ahorraría unos 21 KB más, pero complicaría la edición del sitio por parte de la biblioteca, así que no se aplicó.
- La página de inicio es la más exigente porque tiene la foto a pantalla completa, las animaciones y las noticias dinámicas. Su puntaje de 89 en un celular simulado de gama baja se considera bueno: Google clasifica como "bueno" de 90 en adelante y como "por mejorar" de 50 a 89.

## 6. Verificaciones adicionales

| N.º | Prueba | Resultado |
|---|---|---|
| P-45 | Lighthouse inicial (7 mediciones) | Accesibilidad, buenas prácticas y SEO en 100; rendimiento entre 83 y 96 |
| P-46 | Lighthouse final (7 mediciones) | Rendimiento entre 89 y 99; las demás categorías en 100 |
| P-47 | Fuentes propias | Inter, Lora y Lora cursiva cargan desde el sitio, sin Google Fonts |
| P-48 | Selector de idiomas diferido | El panel no existe al cargar; al abrirlo aparecen las 7 opciones y la traducción al francés funciona |
| P-49 | Enlaces internos con `content-visibility` | El salto a "Meira Delmar" llega a la sección correcta, debajo del encabezado |
