"""
Convierte los documentos Markdown del proyecto (bitácoras, investigación) a Word (.docx).

Soporta: títulos (#..####), párrafos con **negrita**, *cursiva*, `código` y [enlaces](url),
listas con viñetas (anidadas), listas numeradas, casillas [ ] / [x], tablas, citas (>),
bloques de código (```), líneas horizontales (---) y comentarios HTML (se omiten).

Uso (desde la carpeta del proyecto):
    python herramientas/md_a_docx.py                 # convierte todos los .md de docs/
    python herramientas/md_a_docx.py docs/archivo.md # convierte uno solo

Requiere: pip install python-docx
"""
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

RAIZ = Path(__file__).resolve().parent.parent
DOCS = RAIZ / "docs"

FUENTE = "Arial"
ROJO = RGBColor(0xB8, 0x0B, 0x1A)       # rojo institucional (oscurecido para impresión)
TINTA = RGBColor(0x25, 0x25, 0x25)
GRIS = RGBColor(0x5A, 0x52, 0x4A)
MADERA = "8B6B4A"
FONDO_TABLA = "F2ECE2"
FONDO_CODIGO = "F5F5F5"


# ---------------------------------------------------------------- estilos
def configurar_estilos(doc):
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.59), Cm(27.94)       # tamaño carta
    for lado in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, lado, Cm(2.54))

    normal = doc.styles["Normal"]
    normal.font.name = FUENTE
    normal.font.size = Pt(11)
    normal.font.color.rgb = TINTA
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), FUENTE)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.15

    tamanos = {1: 18, 2: 14, 3: 12, 4: 11}
    for nivel, tam in tamanos.items():
        st = doc.styles[f"Heading {nivel}"]
        st.font.name = FUENTE
        rfonts = st.element.rPr.rFonts
        rfonts.set(qn("w:eastAsia"), FUENTE)
        for attr in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):   # el tema de Word forzaba Calibri
            rfonts.attrib.pop(qn(attr), None)
        st.font.size = Pt(tam)
        st.font.bold = True
        st.font.italic = False
        st.font.color.rgb = ROJO if nivel <= 2 else TINTA
        pf = st.paragraph_format
        pf.space_before = Pt(18 if nivel == 1 else 14 if nivel == 2 else 10)
        pf.space_after = Pt(6)
        pf.keep_with_next = True

    for nombre in ("List Bullet", "List Bullet 2", "List Bullet 3"):
        doc.styles[nombre].font.name = FUENTE
        doc.styles[nombre].paragraph_format.space_after = Pt(3)


def borde_inferior(parrafo, color=MADERA, grosor=8):
    pPr = parrafo._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    b = OxmlElement("w:bottom")
    for k, v in (("w:val", "single"), ("w:sz", str(grosor)), ("w:space", "4"), ("w:color", color)):
        b.set(qn(k), v)
    bdr.append(b)
    pPr.append(bdr)


def borde_izquierdo(parrafo, color, grosor=18):
    pPr = parrafo._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    b = OxmlElement("w:left")
    for k, v in (("w:val", "single"), ("w:sz", str(grosor)), ("w:space", "8"), ("w:color", color)):
        b.set(qn(k), v)
    bdr.append(b)
    pPr.append(bdr)


def sombrear(elemento_pr, color):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    elemento_pr.append(shd)


# ---------------------------------------------------------------- texto en línea
INLINE = re.compile(
    r"\*\*\*(?P<bi>.+?)\*\*\*"                                 # ***negrita y cursiva***
    r"|\*\*(?P<b>.+?)\*\*"                                     # **negrita**
    r"|`(?P<code>[^`]+)`"                                      # `código`
    r"|\[(?P<lt>[^\]]+)\]\((?P<lu>[^)]+)\)"                    # [texto](url)
    r"|(?<![\w*])\*(?!\s)(?P<i1>.+?)(?<!\s)\*(?!\w)"           # *cursiva*
    r"|(?<!\w)_(?!\s)(?P<i2>.+?)(?<!\s)_(?!\w)"                # _cursiva_
)


def hipervinculo(parrafo, texto, url):
    part = parrafo.part
    r_id = part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
    h = OxmlElement("w:hyperlink")
    h.set(qn("r:id"), r_id)
    r = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")
    color = OxmlElement("w:color"); color.set(qn("w:val"), "1F4E79"); rPr.append(color)
    u = OxmlElement("w:u"); u.set(qn("w:val"), "single"); rPr.append(u)
    r.append(rPr)
    t = OxmlElement("w:t"); t.text = texto; t.set(qn("xml:space"), "preserve"); r.append(t)
    h.append(r)
    parrafo._p.append(h)


def agregar_inline(parrafo, texto, base_bold=False, base_italic=False, tam=None, color=None):
    pos = 0
    for m in INLINE.finditer(texto):
        if m.start() > pos:
            _run(parrafo, texto[pos:m.start()], base_bold, base_italic, tam=tam, color=color)
        g = m.groupdict()
        if g["bi"] is not None:
            agregar_inline(parrafo, g["bi"], True, True, tam, color)
        elif g["b"] is not None:
            agregar_inline(parrafo, g["b"], True, base_italic, tam, color)
        elif g["code"] is not None:
            _run(parrafo, g["code"], base_bold, base_italic, codigo=True, tam=tam)
        elif g["lt"] is not None:
            if g["lu"].startswith(("http://", "https://", "mailto:")):
                hipervinculo(parrafo, g["lt"], g["lu"])
            else:
                _run(parrafo, g["lt"], base_bold, base_italic, tam=tam, color=color)
        else:
            agregar_inline(parrafo, g["i1"] or g["i2"], base_bold, True, tam, color)
        pos = m.end()
    if pos < len(texto):
        _run(parrafo, texto[pos:], base_bold, base_italic, tam=tam, color=color)


def _run(parrafo, texto, bold=False, italic=False, codigo=False, tam=None, color=None):
    r = parrafo.add_run(texto)
    r.bold, r.italic = bold, italic
    if codigo:
        r.font.name = "Consolas"
        r._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas")
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0x8E, 0x2A, 0x2A)
    elif tam:
        r.font.size = Pt(tam)
    if color is not None and not codigo:
        r.font.color.rgb = color
    return r


# ---------------------------------------------------------------- bloques
def agregar_tabla(doc, filas):
    filas = [f for f in filas if not re.match(r"^\s*\|?\s*:?-{2,}", f)]
    celdas = [[c.strip() for c in f.strip().strip("|").split("|")] for f in filas]
    ncol = max(len(c) for c in celdas)
    tabla = doc.add_table(rows=len(celdas), cols=ncol)
    tabla.style = "Table Grid"
    tabla.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, fila in enumerate(celdas):
        for j in range(ncol):
            texto = fila[j] if j < len(fila) else ""
            celda = tabla.cell(i, j)
            p = celda.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.0
            agregar_inline(p, texto, base_bold=(i == 0), tam=9.5)
            if i == 0:
                sombrear(celda._tc.get_or_add_tcPr(), FONDO_TABLA)
    # Repetir encabezado si la tabla salta de página
    trPr = tabla.rows[0]._tr.get_or_add_trPr()
    h = OxmlElement("w:tblHeader"); h.set(qn("w:val"), "true"); trPr.append(h)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def agregar_codigo(doc, lineas):
    for i, linea in enumerate(lineas or [""]):
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.space_after = Pt(0) if i < len(lineas) - 1 else Pt(8)
        pf.space_before = Pt(6) if i == 0 else Pt(0)
        pf.line_spacing = 1.0
        pf.left_indent = Cm(0.4)
        sombrear(p._p.get_or_add_pPr(), FONDO_CODIGO)
        r = p.add_run(linea if linea else " ")
        r.font.name = "Consolas"
        r._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas")
        r.font.size = Pt(9)


def agregar_cita(doc, texto):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.6)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    borde_izquierdo(p, "B80B1A")
    sombrear(p._p.get_or_add_pPr(), "FBF5EE")
    agregar_inline(p, texto, base_italic=True, color=GRIS)


def item_lista(doc, texto, nivel, numero=None):
    casilla = re.match(r"^\[( |x|X)\]\s+(.*)", texto)
    if casilla:
        texto = ("☑ " if casilla.group(1).lower() == "x" else "☐ ") + casilla.group(2)
    if numero is not None:
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.left_indent = Cm(0.9 + 0.7 * nivel)
        pf.first_line_indent = Cm(-0.6)
        pf.space_after = Pt(3)
        _run(p, f"{numero}.\t", bold=True, color=ROJO)
        pf.tab_stops.add_tab_stop(Cm(0.9 + 0.7 * nivel))
    elif casilla:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.6 + 0.7 * nivel)
        p.paragraph_format.space_after = Pt(3)
    else:
        estilo = ["List Bullet", "List Bullet 2", "List Bullet 3"][min(nivel, 2)]
        p = doc.add_paragraph(style=estilo)
    agregar_inline(p, texto)


# ---------------------------------------------------------------- conversión
def convertir(origen: Path, destino: Path):
    texto = origen.read_text(encoding="utf-8")
    texto = re.sub(r"<!--.*?-->", "", texto, flags=re.S)           # quitar comentarios HTML
    lineas = texto.splitlines()

    doc = Document()
    configurar_estilos(doc)

    # Pie de página con el nombre del proyecto
    pie = doc.sections[0].footer.paragraphs[0]
    pie.alignment = WD_ALIGN_PARAGRAPH.CENTER
    _run(pie, "Portal web Biblioteca Pública Departamental Meira Delmar · Gobernación del Atlántico", tam=8, color=GRIS)

    i = 0
    while i < len(lineas):
        linea = lineas[i]
        s = linea.strip()

        if not s:
            i += 1
            continue

        if s.startswith("```"):                                       # bloque de código
            bloque = []
            i += 1
            while i < len(lineas) and not lineas[i].strip().startswith("```"):
                bloque.append(lineas[i].rstrip())
                i += 1
            agregar_codigo(doc, bloque)
            i += 1
            continue

        m = re.match(r"^(#{1,4})\s+(.*)", s)                          # títulos
        if m:
            nivel = len(m.group(1))
            h = doc.add_heading(level=nivel)
            agregar_inline(h, m.group(2))
            if nivel == 1:
                borde_inferior(h, "B80B1A", 12)
            i += 1
            continue

        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", s):                    # línea horizontal
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(8)
            borde_inferior(p)
            i += 1
            continue

        if s.startswith("|"):                                          # tabla
            filas = []
            while i < len(lineas) and lineas[i].strip().startswith("|"):
                filas.append(lineas[i])
                i += 1
            agregar_tabla(doc, filas)
            continue

        if s.startswith(">"):                                          # cita
            partes = []
            while i < len(lineas) and lineas[i].strip().startswith(">"):
                partes.append(lineas[i].strip().lstrip(">").strip())
                i += 1
            for parte in " ".join(partes).split("  "):
                if parte.strip():
                    agregar_cita(doc, parte.strip())
            continue

        m = re.match(r"^(\s*)([-*+])\s+(.*)", linea)                  # viñetas
        if m:
            item_lista(doc, m.group(3), len(m.group(1).replace("\t", "  ")) // 2)
            i += 1
            continue

        m = re.match(r"^(\s*)(\d+)[.)]\s+(.*)", linea)                # lista numerada
        if m:
            item_lista(doc, m.group(3), len(m.group(1)) // 3, numero=m.group(2))
            i += 1
            continue

        # Párrafo: une las líneas seguidas
        partes = [s]
        i += 1
        while i < len(lineas):
            sig = lineas[i].strip()
            if not sig or re.match(r"^(#{1,4}\s|```|\||>|[-*+]\s|\d+[.)]\s|-{3,}$)", sig):
                break
            partes.append(sig)
            i += 1
        p = doc.add_paragraph()
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        agregar_inline(p, " ".join(partes))

    doc.save(destino)
    return destino


def main():
    archivos = [Path(a) for a in sys.argv[1:]] or sorted(DOCS.glob("*.md"))
    for origen in archivos:
        destino = origen.with_suffix(".docx")
        convertir(origen, destino)
        print(f"  {origen.name}  ->  {destino.name}")


if __name__ == "__main__":
    main()
