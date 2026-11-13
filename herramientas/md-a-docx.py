"""
Convierte las fuentes Markdown de docs/fuentes/ en documentos Word con formato APA 7.

Formato aplicado (Manual de publicaciones APA, 7.ª ed., trabajos de estudiantes):
- Times New Roman 12, texto negro, doble espacio, márgenes de 2,54 cm, hoja carta.
- Párrafos alineados a la izquierda con sangría de primera línea de 1,27 cm.
- Títulos por niveles: nivel 1 centrado en negrita; nivel 2 a la izquierda en negrita;
  nivel 3 a la izquierda en negrita y cursiva.
- Tablas sin líneas verticales, numeradas ("Tabla 1") y con título en cursiva.
- Número de página en el encabezado, a la derecha.
- Referencias con sangría francesa de 1,27 cm.

Nombres: docs/fuentes/bitacora-entrada-02.md  ->  docs/Bitacora Entrada 02.docx

Uso (desde la carpeta del proyecto):
    python herramientas/md-a-docx.py
    python herramientas/md-a-docx.py docs/fuentes/bitacora-entrada-08.md

Requiere: pip install python-docx
"""
import datetime
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

RAIZ = Path(__file__).resolve().parent.parent
DOCS = RAIZ / "docs"
FUENTES = DOCS / "fuentes"

# Metadatos de autoría (cámbielos por el nombre del autor de la tesis)
AUTOR = "Proyecto Portal Biblioteca Meira Delmar"
ORGANIZACION = "Biblioteca Pública Departamental Meira Delmar · Gobernación del Atlántico"
PALABRAS_CLAVE = "Biblioteca Meira Delmar; Gobernación del Atlántico; portal web; bitácora de desarrollo"
PALABRAS_MENORES = {"de", "del", "la", "las", "el", "los", "y", "e", "o", "en", "a"}

FUENTE = "Times New Roman"
FUENTE_CODIGO = "Courier New"
NEGRO = RGBColor(0, 0, 0)
SANGRIA = Cm(1.27)

# Símbolos visuales de las fuentes Markdown que no corresponden a un documento académico
SIMBOLOS = [("✅", "Sí."), ("❌", "No."), ("⚠️", "Parcial."), ("⚠", "Parcial."), ("📘", "")]


# ---------------------------------------------------------------- estilos
def fijar_fuente(estilo_o_run, nombre=FUENTE):
    estilo_o_run.font.name = nombre
    rpr = estilo_o_run.element.get_or_add_rPr() if hasattr(estilo_o_run.element, "get_or_add_rPr") else estilo_o_run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rfonts.set(qn(attr), nombre)
    for attr in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        rfonts.attrib.pop(qn(attr), None)


def configurar_estilos(doc):
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.59), Cm(27.94)
    for lado in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, lado, Cm(2.54))
    sec.header_distance = sec.footer_distance = Cm(1.27)

    normal = doc.styles["Normal"]
    fijar_fuente(normal)
    normal.font.size = Pt(12)
    normal.font.color.rgb = NEGRO
    pf = normal.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    pf.space_before = pf.space_after = Pt(0)

    # Niveles APA: 1 centrado negrita; 2 izquierda negrita; 3 izquierda negrita cursiva
    niveles = {1: (WD_ALIGN_PARAGRAPH.CENTER, False), 2: (WD_ALIGN_PARAGRAPH.CENTER, False),
               3: (WD_ALIGN_PARAGRAPH.LEFT, False), 4: (WD_ALIGN_PARAGRAPH.LEFT, True)}
    for nivel, (alineacion, cursiva) in niveles.items():
        st = doc.styles[f"Heading {nivel}"]
        fijar_fuente(st)
        st.font.size = Pt(12)
        st.font.bold = True
        st.font.italic = cursiva
        st.font.color.rgb = NEGRO
        hpf = st.paragraph_format
        hpf.alignment = alineacion
        hpf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        hpf.space_before = hpf.space_after = Pt(0)
        hpf.first_line_indent = Cm(0)
        hpf.keep_with_next = True

    for nombre in ("List Bullet", "List Bullet 2", "List Bullet 3"):
        st = doc.styles[nombre]
        fijar_fuente(st)
        st.font.size = Pt(12)
        st.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        st.paragraph_format.space_after = Pt(0)


def numero_de_pagina(doc):
    """Encabezado APA de trabajos de estudiantes: solo el número de página, a la derecha."""
    p = doc.sections[0].header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run()
    fijar_fuente(run)
    run.font.size = Pt(12)
    for tipo, texto in (("begin", None), (None, " PAGE "), ("end", None)):
        if tipo:
            fld = OxmlElement("w:fldChar"); fld.set(qn("w:fldCharType"), tipo); run._r.append(fld)
        else:
            instr = OxmlElement("w:instrText"); instr.set(qn("xml:space"), "preserve"); instr.text = texto; run._r.append(instr)


def borde_celda(celda, lados):
    tcPr = celda._tc.get_or_add_tcPr()
    bordes = OxmlElement("w:tcBorders")
    for lado in ("top", "left", "bottom", "right"):
        b = OxmlElement(f"w:{lado}")
        if lado in lados:
            b.set(qn("w:val"), "single"); b.set(qn("w:sz"), "8"); b.set(qn("w:color"), "000000")
        else:
            b.set(qn("w:val"), "nil")
        bordes.append(b)
    tcPr.append(bordes)


# ---------------------------------------------------------------- texto en línea
INLINE = re.compile(
    r"\*\*\*(?P<bi>.+?)\*\*\*"
    r"|\*\*(?P<b>.+?)\*\*"
    r"|`(?P<code>[^`]+)`"
    r"|\[(?P<lt>[^\]]+)\]\((?P<lu>[^)]+)\)"
    r"|(?<![\w*])\*(?!\s)(?P<i1>.+?)(?<!\s)\*(?!\w)"
    r"|(?<!\w)_(?!\s)(?P<i2>.+?)(?<!\s)_(?!\w)"
)


def limpiar_simbolos(texto):
    for simbolo, palabra in SIMBOLOS:
        texto = texto.replace(simbolo, palabra)
    return re.sub(r"\s{2,}", " ", texto).strip()


def hipervinculo(parrafo, texto, url):
    """Enlace activo con el mismo aspecto que el texto (APA permite enlaces sin formato especial)."""
    r_id = parrafo.part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
    h = OxmlElement("w:hyperlink"); h.set(qn("r:id"), r_id)
    r = OxmlElement("w:r")
    t = OxmlElement("w:t"); t.text = texto; t.set(qn("xml:space"), "preserve"); r.append(t)
    h.append(r)
    parrafo._p.append(h)


def agregar_inline(parrafo, texto, base_bold=False, base_italic=False, tam=None):
    pos = 0
    for m in INLINE.finditer(texto):
        if m.start() > pos:
            _run(parrafo, texto[pos:m.start()], base_bold, base_italic, tam=tam)
        g = m.groupdict()
        if g["bi"] is not None:
            agregar_inline(parrafo, g["bi"], True, True, tam)
        elif g["b"] is not None:
            agregar_inline(parrafo, g["b"], True, base_italic, tam)
        elif g["code"] is not None:
            _run(parrafo, g["code"], base_bold, base_italic, codigo=True, tam=tam)
        elif g["lt"] is not None:
            if g["lu"].startswith(("http://", "https://", "mailto:")):
                hipervinculo(parrafo, g["lt"], g["lu"])
            else:
                _run(parrafo, g["lt"], base_bold, base_italic, tam=tam)
        else:
            agregar_inline(parrafo, g["i1"] or g["i2"], base_bold, True, tam)
        pos = m.end()
    if pos < len(texto):
        _run(parrafo, texto[pos:], base_bold, base_italic, tam=tam)


def _run(parrafo, texto, bold=False, italic=False, codigo=False, tam=None):
    r = parrafo.add_run(texto)
    r.bold, r.italic = bold, italic
    if codigo:
        fijar_fuente(r, FUENTE_CODIGO)
        r.font.size = Pt(tam - 1 if tam else 11)
    elif tam:
        r.font.size = Pt(tam)
    return r


# ---------------------------------------------------------------- bloques
class Documento:
    def __init__(self):
        self.doc = Document()
        configurar_estilos(self.doc)
        numero_de_pagina(self.doc)
        self.tablas = 0
        self.ultimo_titulo = ""
        self.en_referencias = False

    def parrafo(self, texto):
        p = self.doc.add_paragraph()
        if self.en_referencias:                                        # sangría francesa APA
            p.paragraph_format.left_indent = SANGRIA
            p.paragraph_format.first_line_indent = -SANGRIA
        else:
            p.paragraph_format.first_line_indent = SANGRIA
        agregar_inline(p, limpiar_simbolos(texto))

    def titulo(self, nivel, texto):
        texto = limpiar_simbolos(texto)
        self.ultimo_titulo = re.sub(r"[*_`]", "", texto)
        self.en_referencias = self.ultimo_titulo.lower().startswith("referencias")
        h = self.doc.add_heading(level=nivel)
        agregar_inline(h, texto)
        for r in h.runs:                      # Word no siempre hereda la negrita del estilo de título
            r.bold = True
            r.italic = nivel == 4 or bool(r.italic)
            r.font.color.rgb = NEGRO
            if r.font.name != FUENTE_CODIGO:
                fijar_fuente(r)

    def tabla(self, filas):
        filas = [f for f in filas if not re.match(r"^\s*\|?\s*:?-{2,}", f)]
        celdas = [[limpiar_simbolos(c.strip()) for c in f.strip().strip("|").split("|")] for f in filas]
        ncol = max(len(c) for c in celdas)
        self.tablas += 1

        # Número y título de la tabla (APA): "Tabla 1" en negrita, título en cursiva
        for texto, negrita, cursiva in ((f"Tabla {self.tablas}", True, False), (self.ultimo_titulo or "Datos", False, True)):
            p = self.doc.add_paragraph()
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.keep_with_next = True
            _run(p, texto, bold=negrita, italic=cursiva)

        t = self.doc.add_table(rows=len(celdas), cols=ncol)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        ultima = len(celdas) - 1
        for i, fila in enumerate(celdas):
            for j in range(ncol):
                celda = t.cell(i, j)
                lados = set()
                if i == 0: lados |= {"top", "bottom"}
                if i == ultima: lados.add("bottom")
                borde_celda(celda, lados)
                p = celda.paragraphs[0]
                pf = p.paragraph_format
                pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
                pf.space_before = pf.space_after = Pt(3)
                pf.first_line_indent = Cm(0)
                if i == 0:
                    pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
                agregar_inline(p, fila[j] if j < len(fila) else "", tam=11)
        trPr = t.rows[0]._tr.get_or_add_trPr()
        h = OxmlElement("w:tblHeader"); h.set(qn("w:val"), "true"); trPr.append(h)
        self.doc.add_paragraph()                                      # línea en blanco después de la tabla

    def codigo(self, lineas):
        for i, linea in enumerate(lineas or [""]):
            p = self.doc.add_paragraph()
            pf = p.paragraph_format
            pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
            pf.left_indent = SANGRIA
            pf.first_line_indent = Cm(0)
            pf.space_after = Pt(12) if i == len(lineas) - 1 else Pt(0)
            r = p.add_run(linea if linea else " ")
            fijar_fuente(r, FUENTE_CODIGO)
            r.font.size = Pt(10)

    def cita(self, texto):
        """Bloque sangrado 1,27 cm, sin comillas ni cursiva (cita en bloque APA)."""
        p = self.doc.add_paragraph()
        p.paragraph_format.left_indent = SANGRIA
        p.paragraph_format.first_line_indent = Cm(0)
        agregar_inline(p, limpiar_simbolos(texto))

    def item(self, texto, nivel, numero=None):
        casilla = re.match(r"^\[( |x|X)\]\s+(.*)", texto)
        if casilla:
            estado = "Hecho" if casilla.group(1).lower() == "x" else "Pendiente"
            texto = f"*{estado}:* {casilla.group(2)}"
        texto = limpiar_simbolos(texto)
        if self.en_referencias:                                        # las referencias no llevan viñetas
            self.parrafo(texto)
            return
        if numero is not None:
            p = self.doc.add_paragraph()
            pf = p.paragraph_format
            pf.left_indent = SANGRIA + Cm(0.63 * (nivel + 1))
            pf.first_line_indent = Cm(-0.63)
            pf.tab_stops.add_tab_stop(pf.left_indent)
            _run(p, f"{numero}.\t")
        else:
            p = self.doc.add_paragraph(style=["List Bullet", "List Bullet 2", "List Bullet 3"][min(nivel, 2)])
        agregar_inline(p, texto)


# ---------------------------------------------------------------- conversión
def convertir(origen: Path, destino: Path):
    texto = re.sub(r"<!--.*?-->", "", origen.read_text(encoding="utf-8"), flags=re.S)
    lineas = texto.splitlines()
    d = Documento()

    i = 0
    while i < len(lineas):
        linea = lineas[i]
        s = linea.strip()

        if not s or re.match(r"^(-{3,}|\*{3,}|_{3,})$", s):         # APA separa con títulos, no con líneas
            i += 1
            continue

        if s.startswith("```"):
            bloque = []
            i += 1
            while i < len(lineas) and not lineas[i].strip().startswith("```"):
                bloque.append(lineas[i].rstrip())
                i += 1
            d.codigo(bloque)
            i += 1
            continue

        m = re.match(r"^(#{1,4})\s+(.*)", s)
        if m:
            d.titulo(len(m.group(1)), m.group(2))
            i += 1
            continue

        if s.startswith("|"):
            filas = []
            while i < len(lineas) and lineas[i].strip().startswith("|"):
                filas.append(lineas[i])
                i += 1
            d.tabla(filas)
            continue

        if s.startswith(">"):
            partes = []
            while i < len(lineas) and lineas[i].strip().startswith(">"):
                partes.append(lineas[i].strip().lstrip(">").strip())
                i += 1
            d.cita(" ".join(partes))
            continue

        m = re.match(r"^(\s*)([-*+])\s+(.*)", linea)
        if m:
            d.item(m.group(3), len(m.group(1).replace("\t", "  ")) // 2)
            i += 1
            continue

        m = re.match(r"^(\s*)(\d+)[.)]\s+(.*)", linea)
        if m:
            d.item(m.group(3), len(m.group(1)) // 3, numero=m.group(2))
            i += 1
            continue

        partes = [s]
        i += 1
        while i < len(lineas):
            sig = lineas[i].strip()
            if not sig or re.match(r"^(#{1,4}\s|```|\||>|[-*+]\s|\d+[.)]\s|-{3,}$)", sig):
                break
            partes.append(sig)
            i += 1
        d.parrafo(" ".join(partes))

    titulo = next((re.sub(r"[*_`]", "", l.lstrip("# ").strip()) for l in lineas if l.startswith("# ")), destino.stem)
    asignar_metadatos(d.doc, titulo)
    d.doc.save(destino)
    return destino


def asignar_metadatos(doc, titulo):
    """Reemplaza los valores por defecto de python-docx ('python-docx', 'generated by python-docx')."""
    cp = doc.core_properties
    ahora = datetime.datetime.now()
    cp.author = AUTOR
    cp.last_modified_by = AUTOR
    cp.title = titulo
    cp.subject = ORGANIZACION
    cp.category = "Trabajo de grado"
    cp.keywords = PALABRAS_CLAVE
    cp.comments = ""
    cp.created = cp.modified = ahora
    cp.revision = 1


def nombre_legible(origen: Path) -> str:
    """'bitacora-entrada-02' -> 'Bitacora Entrada 02'; '01-plan-de-aplicacion' -> '01 Plan de Aplicacion'."""
    palabras = origen.stem.split("-")
    return " ".join(
        p if (i > 0 and p in PALABRAS_MENORES) else p.capitalize()
        for i, p in enumerate(palabras)
    )


def main():
    archivos = [Path(a) for a in sys.argv[1:]] or sorted(FUENTES.glob("*.md"))
    for origen in archivos:
        destino = DOCS / f"{nombre_legible(origen)}.docx"
        convertir(origen, destino)
        print(f"  {origen.name}  ->  {destino.name}")


if __name__ == "__main__":
    main()
