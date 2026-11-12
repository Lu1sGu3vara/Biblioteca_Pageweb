# Entrada 02 — 12/11/2026 · Fase 3: Desarrollo base – Página de inicio

> Para pegar en la Bitácora (Word) y usar en el **Capítulo 4 – Diseño** y el **Capítulo 5 – Desarrollo**.

## Ajustes al plan (actualizar en el documento Word)
- **Entidad confirmada:** Gobernación del Atlántico. Ya no es un riesgo; se elimina la duda "Alcaldía vs. Gobernación".
- **Línea de diseño:** el portal sigue el estilo visual del sitio de la Gobernación (atlantico.gov.co), con una identidad propia de biblioteca.

## Qué se hizo
1. **Estructura del proyecto**
   ```
   sitio/
   ├── index.html        → página de inicio
   ├── css/styles.css    → sistema de diseño y estilos
   ├── js/main.js        → interacciones y animaciones
   ├── img/              → imágenes (pendiente: fotos oficiales)
   └── data/             → datos (catálogo en JSON, próxima fase)
   ```
2. **Análisis del sitio de la Gobernación (atlantico.gov.co)** para heredar su identidad:
   | Elemento | Hallazgo en el sitio de la Gobernación | Cómo se aplicó en el portal |
   |---|---|---|
   | Color institucional | Rojo `#E40E20` | Botones, enlaces, íconos y franja del encabezado |
   | Texto | Gris oscuro `#252525` | Color principal del texto |
   | Tipografía | Sans-serif (Arial) | Texto en *Inter* (sans-serif similar y más legible) |
   | Barra superior | Barra gov.co | Barra gov.co arriba y abajo (Res. 1519 de 2020) |
   | Enlace a la biblioteca | El menú secundario ya tiene un botón **"Biblioteca Departamental"** | **Punto de integración:** ese botón puede apuntar al nuevo portal sin rediseñar el sitio de la Gobernación |
   | Manual de imagen | Publicado como "Manual de Imagen Corporativa 2024" | Pendiente revisarlo para validar logo y usos |
3. **Identidad propia "de biblioteca"** (lo que diferencia el portal):
   - Fondo color papel `#FAF7F2` y detalles en madera `#8B6B4A`.
   - Títulos con tipografía serif *Lora*, que da un aire editorial y literario.
   - Ilustración de un **estante de libros** hecha solo con CSS (no pesa como una imagen). Los libros se mueven al pasar el mouse.
   - Franja bajo el encabezado que une el rojo institucional con el tono madera de la biblioteca.
4. **Página de inicio** con estas secciones:
   - Encabezado fijo con logo, menú y botón "Volver al portal de la Gobernación".
   - Bienvenida con buscador del catálogo.
   - **"¿Qué quieres hacer hoy?":** 6 tarjetas que guían al visitante (historia, catálogo, servicios, agenda, visita, contacto).
   - Adelanto de la historia con línea de tiempo.
   - Próximas actividades.
   - "Visítanos": horario, dirección y contacto.
   - Pie de página institucional con enlaces legales (política de datos y accesibilidad).
5. **Interacciones (JavaScript)**
   - Menú tipo "hamburguesa" en celular, accesible (se cierra con la tecla Escape y anuncia su estado a lectores de pantalla).
   - Sombra en el encabezado al desplazarse.
   - Animación de aparición suave al hacer scroll, en cascada (IntersectionObserver).
   - Se respeta la preferencia de "reducir movimiento" del sistema operativo.

## Decisiones técnicas y justificación
| Decisión | Por qué |
|---|---|
| Heredar rojo, gris y barra gov.co de la Gobernación | Que el visitante sienta que sigue dentro del ecosistema de la Gobernación |
| Usar el rojo solo como acento | El rojo en grandes áreas satura; el requisito pide un diseño sobrio |
| Serif en títulos y sans-serif en textos | Contraste clásico de libros y revistas; mantiene buena legibilidad |
| Ilustración en CSS en vez de imagen | Carga más rápida y se adapta a cualquier pantalla |
| Animaciones que solo se activan con JavaScript | Si el JS falla, el contenido igual se ve (mejora progresiva) |
| Enlace "saltar al contenido", HTML semántico y etiquetas ARIA | Accesibilidad WCAG 2.1 AA |
| Servidor local con Python (`python -m http.server`) | Probar el sitio como si estuviera publicado |

## Pruebas realizadas
- ✅ Vista de escritorio (1280 px): todas las secciones se ven correctamente.
- ✅ Vista de celular (375 px): el menú abre y cierra; no hay desplazamiento horizontal.
- ✅ Contraste del rojo `#E40E20` sobre blanco ≈ 6:1 (cumple AA, mínimo 4.5:1).

## Evidencias (tomar capturas para el Word)
- Abrir el sitio con `python -m http.server 5500 --directory sitio` y entrar a `http://localhost:5500`.
- Captura 1: inicio en escritorio. Captura 2: tarjetas "¿Qué quieres hacer hoy?". Captura 3: inicio en celular con el menú abierto.

## Pendientes
- [ ] Contenido oficial: historia con fechas, horarios, dirección, teléfono y correo (están marcados como `[Por confirmar]`).
- [ ] Logo oficial y revisión del Manual de Imagen Corporativa 2024.
- [ ] Fotos de la biblioteca.
- [ ] Próximo sprint: sub-páginas (Historia, Servicios, Visítanos) con una plantilla común.
