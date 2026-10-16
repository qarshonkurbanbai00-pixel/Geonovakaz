"""GeoNova AI — native Kazakh NLP assistant for the GIS platform.

Understands Kazakh / Russian / English classroom commands:
  * distances   — "Ақтау мен Астананың арақашықтығы қандай?"
  * routes      — "Алматыдан Шымкентке бағыт көрсет"
  * layers      — "Пайдалы қазбаларды көрсет", "Климат қабатын қос"
  * locate      — "Қарағанды қайда?"
  * quiz        — "Осы аймақ бойынша 5 сұрақ құрастыр"
Returns a structured reply: Kazakh text + machine actions for the map.
"""
import random
import re

from ..data import (CITIES, CLIMATE_ZONES, LAYERS_META, MINERALS,
                    extract_cities, find_city)
from .geo_math import bbox_for_points, bearing_deg, direction_kz, haversine_km

KZ_CHARS = set("қғұүңөіһә")

QUIZ_WORDS = ("тест", "сұрақ", "quiz", "викторина", "құрастыр", "генерац", "бағала")
DIST_WORDS = ("арақашықтық", "қашықтық", "қашық", "қанша км", "неше км",
              "distance", "расстояние", "how far")
ROUTE_WORDS = ("бағыт", "маршрут", "route", "жол", "қалай бар", "как доехать",
               "как добраться", "way to", "drive")
LAYER_WORDS = ("қабат", "layer", "слой", "көрсет", "қос", "покажи", "show", "enable")
LOCATE_WORDS = ("қайда", "где", "where", "тап", "найди", "find")

LAYER_ALIASES = {
    "minerals":   ["пайдалы қазба", "минерал", "кен", "шахта", "mining", "mineral", "полезн", "руд"],
    "climate":    ["климат", "ауа райы", "climate", "weather", "климат"],
    "transport":  ["көлік", "теміржол", "тасжол", "транспорт", "transport", "rail", "road", "дорог"],
    "population": ["халық тығыздық", "тұрғын", "халық", "population", "населен", "density", "тығыздық"],
}


def detect_language(text: str) -> str:
    low = text.lower()
    if any(ch in KZ_CHARS for ch in low):
        return "kk"
    if re.search(r"[а-яё]", low):
        return "ru"
    return "en"


def _lang_of(text):
    for lang in ("kk", "ru", "en"):
        if lang in text:
            return lang
    return None


def _city_name(city, lang):
    return {"kk": city["name_kz"], "ru": city["name_ru"], "en": city["name_en"]}.get(lang, city["name_kz"])


def _match_layer(text: str):
    low = text.lower()
    for key, words in LAYER_ALIASES.items():
        if any(w in low for w in words):
            return key
    return None


def generate_quiz(layer: str | None = None, region: str | None = None,
                  n: int = 5, lang: str = "kk") -> dict:
    """Build n interactive questions from the selected layer/region data."""
    pool = []

    if layer in (None, "minerals"):
        for m in MINERALS:
            others = random.sample([x["type"] for x in MINERALS if x["type"] != m["type"]], 3)
            pool.append({
                "type": "choice",
                "question": f"«{m['name']}» — қандай пайдалы қазба?",
                "options": [m["type"], *others],
                "answer": 0, "lat": m["lat"], "lon": m["lon"],
            })
    if layer in (None, "climate"):
        for z in CLIMATE_ZONES[:3]:
            pool.append({
                "type": "choice",
                "question": f"«{z['name']}» белдемінің ерекшелігі қайсы?",
                "options": [z["desc"], "Мұзды белдем, мәңгі тоң", "Экваторлық джунгли белдемі", "Муссонды тропик белдемі"],
                "answer": 0,
                "lat": sum(p[0] for p in z["polygon"]) / len(z["polygon"]),
                "lon": sum(p[1] for p in z["polygon"]) / len(z["polygon"]),
            })
    if layer in (None, "population", "transport") or region:
        cities = random.sample(CITIES, min(n + 2, len(CITIES)))
        for c in cities:
            other = random.choice([x for x in CITIES if x["id"] != c["id"]])
            correct = max(c, other, key=lambda x: x["pop"]["2025"])
            pool.append({
                "type": "choice",
                "question": f"Қай қаланың халқы көбірек: {c['name_kz']} әлде {other['name_kz']} ме?",
                "options": [c["name_kz"], other["name_kz"]],
                "answer": 0 if correct["id"] == c["id"] else 1,
                "lat": correct["lat"], "lon": correct["lon"],
            })
            pool.append({
                "type": "map",
                "question": f"Картадан {c['name_kz']} қаласын тап!",
                "options": [], "answer": None,
                "lat": c["lat"], "lon": c["lon"],
            })

    random.shuffle(pool)
    questions = pool[:n]
    for q in questions:  # shuffle options, track correct index
        if q["type"] == "choice":
            correct = q["options"][q["answer"]]
            random.shuffle(q["options"])
            q["answer"] = q["options"].index(correct)
    title_map = {"minerals": "Пайдалы қазбалар", "climate": "Климат белдемдері",
                 "transport": "Көлік желілері", "population": "Халық тығыздығы"}
    title = title_map.get(layer) or region or "Қазақстан географиясы"
    return {"title": f"Тест: {title}", "questions": questions}


def respond(text: str) -> dict:
    """Main NLP entry. Returns {intent, lang, reply, actions, quiz?}."""
    lang = detect_language(text)
    low = text.lower().strip()
    cities = extract_cities(low)

    # ---------------- quiz generation -------------------------------------
    if any(w in low for w in QUIZ_WORDS):
        layer = _match_layer(low)
        region = cities[0]["region"] if cities else None
        quiz = generate_quiz(layer=layer, region=region, n=5, lang=lang)
        reply = f"Дайын! «{quiz['title']}» тақырыбынан 5 интерактивті сұрақ құрастырдым. «Тесттер» бөлімінде бастай аласыз. ✍️"
        return {"intent": "quiz", "lang": lang, "reply": reply, "quiz": quiz,
                "actions": [{"type": "enableLayer", "layer": layer} if layer else {"type": "noop"}]}

    # ---------------- distance / route ------------------------------------
    if len(cities) >= 2 and (any(w in low for w in DIST_WORDS) or any(w in low for w in ROUTE_WORDS)):
        a, b = cities[0], cities[1]
        dist = haversine_km(a["lat"], a["lon"], b["lat"], b["lon"])
        brg = bearing_deg(a["lat"], a["lon"], b["lat"], b["lon"])
        an, bn = _city_name(a, lang), _city_name(b, lang)
        is_route = any(w in low for w in ROUTE_WORDS) and not any(w in low for w in DIST_WORDS)
        if lang == "ru":
            reply = (f"Маршрут {an} → {bn} показан на карте. Расстояние по прямой: ≈{dist} км."
                     if is_route else
                     f"Расстояние между {an} и {bn}: ≈{dist} км по прямой.")
        elif lang == "en":
            reply = (f"Route {an} → {bn} is drawn on the map. Straight-line distance: ≈{dist} km."
                     if is_route else
                     f"The distance between {an} and {bn} is ≈{dist} km (straight line).")
        else:
            reply = (f"{an} → {bn} бағыты картада көрсетілді. Түзу сызық қашықтығы: ≈{dist} км, бағыт — {direction_kz(brg)}. 🧭"
                     if is_route else
                     f"{an} мен {bn} арақашықтығы түзу сызық бойынша ≈{dist} км ({direction_kz(brg)} қарай). 📏")
        return {"intent": "route" if is_route else "distance", "lang": lang, "reply": reply,
                "actions": [{"type": "route",
                             "from": [a["lat"], a["lon"]], "to": [b["lat"], b["lon"]],
                             "from_name": an, "to_name": bn, "distance_km": dist,
                             "bearing": brg,
                             "bounds": bbox_for_points([[a["lat"], a["lon"]], [b["lat"], b["lon"]]])}]}

    # ---------------- layer toggles ---------------------------------------
    if any(w in low for w in LAYER_WORDS):
        layer = _match_layer(low)
        if layer:
            meta = next(m for m in LAYERS_META if m["key"] == layer)
            reply = (f"«{meta['name_kz']}» қабаты қосылды. Сол жақ панельден басқара аласыз. 🗺️"
                     if lang == "kk" else f"Слой «{meta['name_kz']}» включён. 🗺️")
            return {"intent": "layer", "lang": lang, "reply": reply,
                    "actions": [{"type": "enableLayer", "layer": layer}]}

    # ---------------- locate a city ---------------------------------------
    if cities and any(w in low for w in LOCATE_WORDS) or (len(cities) == 1 and "?" not in low and len(low.split()) <= 3):
        c = cities[0]
        name = _city_name(c, lang)
        reply = (f"{name} — {c['region']}. Картаға жақындаттым. Халқы (2025): ≈{c['pop']['2025']} мың. 📍"
                 if lang == "kk" else f"{name} — {c['region']}. Приблизил карту. 📍")
        return {"intent": "locate", "lang": lang, "reply": reply,
                "actions": [{"type": "flyTo", "lat": c["lat"], "lon": c["lon"], "zoom": 9,
                             "label": name}]}

    # ---------------- fallback help ---------------------------------------
    help_kz = ("Сәлем! Мен GeoNova AI-мың. Мынандай сұрақтар қоя аласыз:\n"
               "• «Ақтау мен Астананың арақашықтығы»\n"
               "• «Алматыдан Шымкентке бағыт көрсет»\n"
               "• «Пайдалы қазбаларды көрсет» / «Климат қабатын қос»\n"
               "• «Осы аймақ бойынша 5 сұрақ құрастыр»\n"
               "• «Қарағанды қайда?»")
    help_ru = "Привет! Спросите: расстояние между городами, маршрут, включите слой или попросите тест из 5 вопросов."
    help_en = "Hi! Ask me distances, routes between Kazakh cities, toggle map layers, or request a 5-question quiz."
    return {"intent": "help", "lang": lang,
            "reply": {"kk": help_kz, "ru": help_ru, "en": help_en}[lang], "actions": []}
