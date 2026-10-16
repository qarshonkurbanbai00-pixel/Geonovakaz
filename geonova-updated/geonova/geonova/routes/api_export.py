import base64

from flask import Blueprint, jsonify, request, send_file
import io

from ..data import CITIES, TIMELINE_YEARS
from ..services.export_service import build_pdf

bp = Blueprint("api_export", __name__)


def _population_rows(year):
    rows = [["Қала / City", "Аймақ / Region", f"Халық, мың ({year})"]]
    for c in sorted(CITIES, key=lambda x: -x["pop"][str(year)]):
        rows.append([c["name_kz"], c["region"], str(c["pop"][str(year)])])
    return rows


@bp.post("/pdf")
def export_pdf():
    payload = request.get_json(silent=True) or {}
    year = int(payload.get("year", TIMELINE_YEARS[-1]))
    if str(year) not in [str(y) for y in TIMELINE_YEARS]:
        year = TIMELINE_YEARS[-1]
    layers = payload.get("layers") or []
    png_b64 = (payload.get("map_png") or "").split(",")[-1]
    png_bytes = base64.b64decode(png_b64) if png_b64 else None
    pdf = build_pdf(payload.get("title", "GeoNova есебі"), year, layers,
                    map_png_bytes=png_bytes, rows=_population_rows(year))
    return send_file(io.BytesIO(pdf), mimetype="application/pdf",
                     as_attachment=True, download_name=f"geonova_report_{year}.pdf")


@bp.get("/population/<int:year>")
def population_table(year):
    """JSON analysis table used by the UI and PDF export."""
    if str(year) not in [str(y) for y in TIMELINE_YEARS]:
        return jsonify({"error": "unknown year"}), 404
    return jsonify({"year": year, "rows": _population_rows(year)})
