from flask import Blueprint, current_app, jsonify, request

from ..data import CITIES, GAME_REGION_BOUNDS
from ..services import quiz_service as qs

bp = Blueprint("api_quiz", __name__)


def _db():
    return current_app.config["DATABASE"]


# ---------------------------------------------------------- quiz builder ---
@bp.get("/quizzes")
def list_quizzes():
    return jsonify(qs.list_custom_quizzes(_db()))


@bp.get("/quizzes/<int:quiz_id>")
def get_quiz(quiz_id):
    q = qs.get_custom_quiz(_db(), quiz_id)
    return (jsonify(q), 200) if q else (jsonify({"error": "not found"}), 404)


@bp.post("/quizzes")
def create_quiz():
    payload = request.get_json(silent=True) or {}
    questions = payload.get("questions") or []
    if not payload.get("title") or not questions:
        return jsonify({"error": "title and at least one question are required"}), 400
    qid = qs.add_custom_quiz(_db(), payload["title"], payload.get("author"), questions)
    return jsonify({"id": qid, "ok": True}), 201


# -------------------------------------------------------------- geog game --
@bp.get("/game/cities")
def game_cities():
    """Random city targets within Kazakhstan bounds for the 'Find the City' game."""
    import random
    sample = random.sample(CITIES, min(10, len(CITIES)))
    return jsonify({
        "bounds": GAME_REGION_BOUNDS,
        "targets": [{"name_kz": c["name_kz"], "lat": c["lat"], "lon": c["lon"],
                     "region": c["region"]} for c in sample],
    })


# ---------------------------------------------------------------- scores ---
@bp.get("/scores")
def scores():
    return jsonify(qs.top_scores(_db()))


@bp.post("/scores")
def add_score():
    payload = request.get_json(silent=True) or {}
    sid = qs.save_score(_db(), payload.get("player"), payload.get("score", 0),
                        payload.get("total", 0), payload.get("duration_sec", 0),
                        payload.get("mode", "find_city"))
    return jsonify({"id": sid, "ok": True, "top": qs.top_scores(_db())}), 201
