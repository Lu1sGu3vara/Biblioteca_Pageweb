# Entrada 03 — 12/11/2026 · Fases 1, 4 y 5: Investigación, sub-páginas, noticias y mejora visual

> Para pegar en la Bitácora (Word). Sirve para el **Capítulo 2 (contexto institucional)**, el **Capítulo 3 (Análisis)**, el **Capítulo 4 (Diseño)** y el **Capítulo 5 (Desarrollo)**.
> La investigación completa, con referencias en APA, está en `docs/investigacion_meira_delmar_y_biblioteca.md`.

---

## 1. Investigación documental

Se investigó la vida de **Meira Delmar** y la historia de la **Biblioteca Pública Departamental Meira Delmar** en fuentes oficiales (portal de la Gobernación, Ordenanza 12 de 1921, Decreto 00924 de 1998 y Ley 889 de 2004), prensa (El Heraldo, El Tiempo) y fuentes de referencia.

**Hallazgos principales**
| Hallazgo | Impacto en el proyecto |
|---|---|
| La biblioteca se inauguró en **1922**, el mismo año en que nació Meira Delmar | Se convirtió en el **hilo narrativo** del portal: "Dos historias que nacieron en 1922" |
| Meira Delmar dirigió la biblioteca **36 años (1958–1994)**, y desde 1998 la biblioteca lleva su nombre | Se le dedicó una sección destacada en el inicio y en Historia |
| El catálogo actual funciona con **Koha 23.05** (`biblioteca.atlantico.gov.co:8001`) | **Decisión clave:** no se construye un catálogo nuevo. El buscador del portal consulta directamente el Koha existente |
| Hay una biblioteca digital (DSpace) y una colección de libros electrónicos | Se enlazan desde Servicios |
| La biblioteca tiene un **aula tiflotecnológica** con más de 400 libros en braille | Refuerza la accesibilidad (WCAG 2.1 AA) como requisito |
| La información de la biblioteca está **dispersa** en unas 6 sub-páginas del sitio de la Gobernación | Confirma el problema que justifica el proyecto (Capítulo 1) |
| Datos reales: dirección (Calle 38 N.º 38B-21), horario (lunes a viernes, 8:00 a. m.–4:00 p. m.), servicios, misión y visión | Reemplazan los textos provisionales |

**Ajuste al plan (actualizar en el Word):** el requerimiento **RF-04 Catálogo** cambia de "catálogo propio en JSON" a "**buscador integrado con el OPAC de Koha existente**". Así se reduce el alcance y se evita duplicar datos.

---

## 2. Páginas internas creadas

Todas comparten una plantilla común: barra gov.co, encabezado, migas de pan, cabecera de página, submenú interno con la sección activa resaltada, botón "volver arriba" y pie institucional.

| Página | Contenido |
|---|---|
| **La Biblioteca** (`historia.html`) | Origen, **línea del tiempo de 9 hitos** (1921 → hoy), vida y obra de Meira Delmar (biografía, seudónimo, reconocimientos y 8 libros en forma de lomos), el edificio por pisos, misión y visión oficiales |
| **Servicios** (`servicios.html`) | 10 servicios oficiales (lectura en sala, préstamo con la "Llave del Saber", sala infantil, aula tiflotecnológica, internet, hemeroteca, Museo Meira Delmar, promoción de lectura, alfabetización digital, extensión a municipios), cómo afiliarse en 3 pasos y preguntas frecuentes desplegables |
| **Visítanos** (`visitanos.html`) | Horario que **resalta el día de hoy** e indica en tiempo real si está **abierto o cerrado** (hora de Colombia), contacto, mapa, cómo llegar y recomendaciones |

---

## 3. Sección de noticias y eventos semanales (requerimiento nuevo)

**Solicitud:** un espacio en el inicio para publicar los eventos de cada semana.

**Solución:** las noticias se guardan en un archivo de datos, **`sitio/data/noticias.json`**, y la página las muestra automáticamente.

- **Cómo se agrega un evento:** se copia un bloque y se cambian el título, la fecha, la hora, el lugar, la categoría y el resumen. No hay que tocar el HTML ni saber programar.
- **Comportamiento automático:**
  - Solo muestra los eventos de hoy en adelante y las noticias de los últimos 30 días.
  - Ordena primero los eventos destacados y luego los más cercanos.
  - Etiqueta cada evento como **Hoy**, **Mañana**, **Esta semana** o **Próximamente**.
  - Asigna un color y un ícono según la categoría (cultura, infantil, taller, club, cine, noticia).
- **Filtros:** botones para ver solo un tipo de actividad.
- **Seguridad:** los textos se "escapan" antes de mostrarse, para evitar inyección de código (XSS).

**Ejemplo de un evento en el archivo:**
```json
{
  "titulo": "Hora del cuento",
  "fecha": "2026-11-17",
  "hora": "10:00",
  "lugar": "Sala infantil",
  "categoria": "infantil",
  "resumen": "Cuentos, títeres y juegos para niñas y niños de 3 a 8 años.",
  "destacado": false,
  "imagen": ""
}
```

> **Mejora futura (para Recomendaciones):** conectar esta sección a un gestor de contenidos (CMS) o a una hoja de cálculo para que el personal publique sin editar archivos.

---

## 4. Mejora del diseño: "más cómodo y enganchante"

**Solicitud:** el diseño se sentía demasiado simple.

**Criterio:** las normas de la Gobernación fijan la identidad (rojo institucional, barra gov.co, marca), no el nivel de interacción. Por eso se agregaron microinteracciones que no rompen la sobriedad:

| Mejora | Propósito |
|---|---|
| **Palabra que rota** en el título ("leer", "aprender", "imaginar", "encontrarnos") | Captar la atención desde el primer segundo |
| **Sello "Desde 1922"** animado sobre el estante | Reforzar la identidad histórica |
| **Estante con efecto 3D** que sigue el mouse | Sensación de profundidad y de estar en una biblioteca |
| **Cifras animadas** (100+ años, 36 años, 22 municipios, 400+ libros en braille) | Comunicar logros de un vistazo |
| Buscador con **sugerencias rápidas** ("Meira Delmar", "García Márquez"…) | Guiar al visitante que no sabe qué buscar |
| Tarjetas con **numeración**, línea roja e ícono que se rellena al pasar el mouse | Navegación más táctil y clara |
| **Sección destacada de Meira Delmar** con monograma "MD" y olas animadas (guiño a "Del mar") | Conexión emocional con la figura central |
| **Textura sutil de papel** en el fondo | Calidez de biblioteca sin usar imágenes pesadas |
| **Barra de progreso de lectura** y **botón volver arriba** | Comodidad en páginas largas |
| Indicador **"Abierto ahora / Cerrado"** | Información útil al instante |

**Accesibilidad:** todas las animaciones se desactivan si el usuario tiene activada la opción "reducir movimiento" en su sistema. Los textos decorativos tienen su equivalente para lectores de pantalla.

---

## Pruebas realizadas
- ✅ Inicio, Historia, Servicios y Visítanos en escritorio (1280 px).
- ✅ Inicio en celular (375 px): sin desplazamiento horizontal; filtros y tarjetas en una columna.
- ✅ Las noticias cargan desde el JSON y los filtros funcionan.
- ✅ El horario resalta el día actual y el estado "Abierto ahora" se calcula con la hora de Colombia.
- ✅ Sin errores en la consola del navegador.
- ⚠️ El mapa de Google ocupa todo su espacio, pero no se pudo ver cargado en la vista previa de desarrollo. Hay que confirmarlo en un navegador normal.

## Evidencias sugeridas (capturas para el Word)
1. Inicio: hero con el sello 1922 y las cifras.
2. Sección "Esta semana en la biblioteca" con los filtros.
3. Sección destacada de Meira Delmar.
4. Línea del tiempo en Historia.
5. Horario con "Hoy" resaltado en Visítanos.
6. El archivo `noticias.json` abierto, para mostrar lo fácil que es agregar un evento.

## Pendientes
- [ ] Validar con la entidad: el día de nacimiento de Meira (21 de abril o 21 de agosto), el teléfono y correo propios de la biblioteca y los requisitos de la Llave del Saber.
- [ ] Fotografías oficiales del edificio, de la poeta y de los eventos, con autorización de uso.
- [ ] Logo oficial (Manual de Imagen Corporativa 2024).
- [ ] Próximo sprint: páginas **Contacto** (formulario con política de datos, Ley 1581), **Agenda** completa y **Política de datos / Accesibilidad**.
