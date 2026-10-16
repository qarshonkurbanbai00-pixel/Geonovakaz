"""PDF report generation with ReportLab (Cyrillic-capable font fallback)."""
import io
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, Paragraph, SimpleDocTemplate, Spacer,
                                Table, TableStyle)

_FONT_REGISTERED = False
_FONT_NAME = "Helvetica"

_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
]


def _register_font():
    global _FONT_REGISTERED, _FONT_NAME
    if _FONT_REGISTERED:
        return
    for path in _FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont("GeoNovaFont", path))
                _FONT_NAME = "GeoNovaFont"
                break
            except Exception:
                continue
    _FONT_REGISTERED = True


def build_pdf(title, year, layers, map_png_bytes=None, rows=None) -> bytes:
    """Compose a one-page classroom report PDF. rows: list of [col, col, ...]."""
    _register_font()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            leftMargin=14 * mm, rightMargin=14 * mm,
                            topMargin=12 * mm, bottomMargin=12 * mm)
    title_st = ParagraphStyle("t", fontName=_FONT_NAME, fontSize=20, textColor=colors.HexColor("#0d47a1"))
    sub_st = ParagraphStyle("s", fontName=_FONT_NAME, fontSize=11, textColor=colors.HexColor("#37474f"))
    story = [
        Paragraph("GeoNova — " + (title or "Карта есебі / Map Report"), title_st),
        Spacer(1, 4),
        Paragraph(f"Жыл / Year: {year} &nbsp;&nbsp;|&nbsp;&nbsp; Қабаттар / Layers: {', '.join(layers) if layers else '—'}", sub_st),
        Spacer(1, 8),
    ]
    if map_png_bytes:
        img = Image(io.BytesIO(map_png_bytes))
        max_w, max_h = 250 * mm, 120 * mm
        ratio = min(max_w / img.imageWidth, max_h / img.imageHeight)
        img.drawWidth, img.drawHeight = img.imageWidth * ratio, img.imageHeight * ratio
        story.append(img)
        story.append(Spacer(1, 8))
    if rows:
        t = Table(rows, repeatRows=1)
        t.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), _FONT_NAME),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1565c0")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#90a4ae")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eceff1")]),
        ]))
        story.append(t)
    story.append(Spacer(1, 6))
    story.append(Paragraph("GeoNova Educational GIS Platform — generated automatically.", sub_st))
    doc.build(story)
    return buf.getvalue()
