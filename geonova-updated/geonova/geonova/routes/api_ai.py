from flask import Blueprint, jsonify, request

from ..services.geonova_ai import generate_quiz, respond

bp = Blueprint("api_ai", __name__)


@bp.post("/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("message") or "").strip()
    if not text:
        return jsonify({"intent": "error", "lang": "kk",
                        "reply": "Бос хабарлама. Мысалы: «Ақтау мен Астананың арақашықтығы»", "actions": []}), 400
    return jsonify(respond(text))


@bp.post("/quiz")
def ai_quiz():
    payload = request.get_json(silent=True) or {}
    return jsonify(generate_quiz(layer=payload.get("layer"),
                                 region=payload.get("region"),
                                 n=int(payload.get("n", 5))))
