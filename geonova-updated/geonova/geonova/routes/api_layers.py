from flask import Blueprint, jsonify

from ..data import (ARAL_SEA, CITIES, CLIMATE_ANOMALY, CLIMATE_ZONES,
                    LAYERS_META, MINERALS, TIMELINE_YEARS, TRANSPORT)

bp = Blueprint("api_layers", __name__)


@bp.get("/layers")
def layers():
    return jsonify({
        "years": TIMELINE_YEARS,
        "layers_meta": LAYERS_META,
        "cities": [{k: v for k, v in c.items()} for c in CITIES],
        "minerals": MINERALS,
        "climate_zones": CLIMATE_ZONES,
        "climate_anomaly": CLIMATE_ANOMALY,
        "transport": TRANSPORT,
        "aral_sea": ARAL_SEA,
    })
