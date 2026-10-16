"""Demo / smoke-test script: exercises the GeoNova API end-to-end.

Run the app first (python run.py), then:  python scripts/demo.py
"""
import json
import urllib.request

BASE = "http://127.0.0.1:5000"


def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.loads(r.read().decode())


def post(path, payload):
    req = urllib.request.Request(
        BASE + path, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


if __name__ == "__main__":
    print("== layers ==")
    data = get("/api/layers")
    print("cities:", len(data["cities"]), "| minerals:", len(data["minerals"]),
          "| climate zones:", len(data["climate_zones"]))

    print("\n== AI: distance in Kazakh ==")
    print(post("/api/ai/chat", {"message": "Ақтау мен Астананың арақашықтығы"})["reply"])

    print("\n== AI: route in English ==")
    print(post("/api/ai/chat", {"message": "Show route from Almaty to Shymkent"})["reply"])

    print("\n== AI: quiz generation ==")
    quiz = post("/api/ai/quiz", {"layer": "minerals", "n": 5})
    print(quiz["title"], "->", len(quiz["questions"]), "questions")

    print("\n== custom quiz builder ==")
    qid = post("/api/quizzes", {
        "title": "Демо тест", "author": "Demo Teacher",
        "questions": [{"type": "choice", "question": "Астана қай аймақта?",
                       "options": ["Ақмола облысы", "Алматы", "Түркістан", "Атырау"],
                       "answer": 0, "lat": 51.17, "lon": 71.45}],
    })["id"]
    print("saved quiz id:", qid, "| list size:", len(get("/api/quizzes")))

    print("\n== scoreboard ==")
    post("/api/scores", {"player": "Demo", "score": 8, "total": 10, "duration_sec": 95})
    print("top:", get("/api/scores")[0])

    print("\n== population table 2020 ==")
    print(get("/api/export/population/2020")["rows"][:3])
    print("\nAll demo checks passed ✔")
