"""
Generador de páginas internas — Portal Biblioteca Meira Delmar.

Toma el encabezado y el pie de página de una página existente (visitanos.html)
como plantilla, y crea cada página nueva a partir de su contenido en
herramientas/contenido/<pagina>.html. Así todas las páginas comparten exactamente
la misma barra gov.co, el mismo menú y el mismo pie institucional.

Uso (desde la carpeta del proyecto):
    python herramientas/generar_paginas.py
"""
from pathlib import Path
import re

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio"
CONTENIDO = Path(__file__).resolve().parent / "contenido"
PLANTILLA = SITIO / "visitanos.html"

# archivo -> (título, descripción, enlace del menú que queda activo)
PAGINAS = {
    "contacto.html": (
        "Contacto",
        "Escríbele a la Biblioteca Pública Departamental Meira Delmar: consultas, visitas guiadas, donaciones y sugerencias.",
        "contacto.html",
    ),
    "agenda.html": (
        "Agenda",
        "Agenda cultural de la Biblioteca Meira Delmar: talleres, clubes de lectura, cine, actividades infantiles y noticias.",
        "agenda.html",
    ),
    "catalogo.html": (
        "Catálogo",
        "Busca libros en el catálogo en línea de la Biblioteca Meira Delmar y accede a la biblioteca digital y los libros electrónicos.",
        "catalogo.html",
    ),
    "politica-datos.html": (
        "Política de tratamiento de datos",
        "Política de tratamiento de datos personales del portal de la Biblioteca Meira Delmar (Ley 1581 de 2012).",
        None,
    ),
    "accesibilidad.html": (
        "Accesibilidad",
        "Declaración de accesibilidad del portal de la Biblioteca Meira Delmar (WCAG 2.1 nivel AA, Resolución 1519 de 2020).",
        None,
    ),
}


def partes_plantilla():
    html = PLANTILLA.read_text(encoding="utf-8")
    inicio = html.index("  <main id=\"contenido\">")
    fin = html.index("  </main>") + len("  </main>\n")
    return html[:inicio], html[fin:]


def preparar_cabecera(cabecera, titulo, descripcion, activo):
    cabecera = re.sub(r"<title>.*?</title>", f"<title>{titulo} | Biblioteca Meira Delmar</title>", cabecera)
    cabecera = re.sub(r'(<meta name="description" content=")[^"]*(")', rf"\g<1>{descripcion}\g<2>", cabecera)
    # Quitar el enlace activo de la plantilla
    cabecera = cabecera.replace(' is-active" aria-current="page"', '"')
    cabecera = cabecera.replace('class="nav__link nav__link--cta"', 'class="nav__link nav__link--cta"')
    if activo:
        patron = f'<a href="{activo}" class="nav__link'
        idx = cabecera.index(patron)
        cierre = cabecera.index('"', idx + len(patron))
        cabecera = cabecera[:cierre] + ' is-active" aria-current="page' + cabecera[cierre:]
    return cabecera


def main():
    cabecera, pie = partes_plantilla()
    for archivo, (titulo, descripcion, activo) in PAGINAS.items():
        fuente = CONTENIDO / archivo
        if not fuente.exists():
            print(f"  (omitida) {archivo}: no existe {fuente.name}")
            continue
        cuerpo = fuente.read_text(encoding="utf-8").rstrip() + "\n"
        html = preparar_cabecera(cabecera, titulo, descripcion, activo) + cuerpo + pie
        (SITIO / archivo).write_text(html, encoding="utf-8")
        print(f"  generada  {archivo}")


if __name__ == "__main__":
    main()
