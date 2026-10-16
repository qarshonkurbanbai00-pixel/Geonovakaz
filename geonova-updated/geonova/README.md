# 🛰️ GeoNova — Kazakhstan Educational GIS Platform

Interactive Flask + Leaflet GIS platform for geography education in Kazakhstan,
with a native **Kazakh-speaking AI assistant**, curriculum-aligned layers,
time-series slider, drawing tools, quizzes and PDF/PNG export.

## ✨ Features

| Area | What you get |
|---|---|
| 🗺️ Map | Leaflet map of Kazakhstan, dark/light responsive UI (desktop, whiteboard, tablet) |
| 🎓 Layers | Пайдалы қазбалар (minerals), Климат белдемдері (climate), Көлік желілері (roads+railways), Халық тығыздығы (population bubbles) |
| ⏳ Timeline | 1990→2025 slider + autoplay: population growth, Aral Sea shrinkage, climate anomaly badge |
| ✏️ Drawing | Freehand lines, region highlight, polygon **area measure**, polyline **length measure**, custom 🔤 text labels |
| 🤖 GeoNova AI | Kazakh/Russian/English NLP: distances (`Ақтау мен Астананың арақашықтығы`), routes with map zoom, layer toggles, **5-question quiz generator** |
| 🎯 Geog game | "Find the City" with live score, timer and persistent high-score table |
| 👩‍🏫 Teacher | Custom quiz builder: click coordinates on the map, add pinpoint questions, save for students |
| 📄 Export | High-res PNG snapshot + one-click PDF report (map image + population table) via ReportLab |

## 🗂️ Structure (modular Flask)

```
geonova/
├── run.py                  # entry point
├── requirements.txt
├── geonova/
│   ├── __init__.py         # application factory (create_app)
│   ├── config.py           # configuration
│   ├── data.py             # seed GIS data (cities, layers, Aral Sea, time series)
│   ├── routes/
│   │   ├── pages.py        # HTML pages
│   │   ├── api_layers.py   # GET /api/layers
│   │   ├── api_ai.py       # POST /api/ai/chat, /api/ai/quiz
│   │   ├── api_quiz.py     # custom quizzes, game cities, scores
│   │   └── api_export.py   # POST /api/export/pdf, population tables
│   └── services/
│       ├── geonova_ai.py   # Kazakh NLP assistant + quiz generator
│       ├── geo_math.py     # geodesic distance / bearing / bbox
│       ├── quiz_service.py # SQLite persistence (quizzes, scores)
│       └── export_service.py # ReportLab PDF builder
├── templates/              # base, index (map), geog (game), teacher, quiz
├── static/
│   ├── css/main.css        # responsive dark/light theme
│   └── js/modules/         # state, mapCore, layers, timeline, drawing,
│                           # ai, export, game, teacher, quiz
└── scripts/demo.py         # end-to-end API smoke test
```

## Map and interface update

All four map views use the same key-free OpenStreetMap tile factory in
`static/js/modules/mapCore.js`:
`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
No map-provider API key or paid map layer is configured. Required OpenStreetMap
contributor attribution remains visible on the map and in PNG/PDF snapshots.
Public tiles require an internet connection and remain subject to the
[OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/);
this is not an unlimited tile-hosting service or an offline map bundle.

The shared interface uses responsive grid/flex layouts, stacked controls,
independently scrollable tables, dedicated map/timeline/assistant cards,
persistent light/dark themes, keyboard focus indicators, hover feedback,
panel fade-ins, and reduced-motion support. The original Kazakh UI and
existing GIS, game, quiz, teacher, assistant, and export features are retained.
Maps resize automatically when their containers change dimensions.

## 🚀 Quick start

```bash
pip install -r requirements.txt
python run.py                 # http://127.0.0.1:5000
```

Production:

```bash
gunicorn 'geonova:create_app()' --bind 0.0.0.0:8000
```

Smoke test (with the server running):

```bash
python scripts/demo.py
```

## 🤖 GeoNova AI commands

| Command | Result |
|---|---|
| `Ақтау мен Астананың арақашықтығы` | distance in km + line drawn, map zooms to both cities |
| `Алматыдан Шымкентке бағыт көрсет` / `Show route from Almaty to Shymkent` | route polyline + distance label |
| `Пайдалы қазбаларды көрсет` | enables the minerals layer |
| `Климат қабатын қос` | enables climate zones |
| `Осы аймақ бойынша 5 сұрақ құрастыр` | generates a 5-question quiz (opens under Тесттер) |
| `Қарағанды қайда?` | flies the map to the city |

## 🔌 API overview

- `GET  /api/layers` — all seed data (cities, minerals, climate, transport, Aral Sea, years)
- `POST /api/ai/chat` — `{message}` → `{reply, actions[], quiz?}`
- `POST /api/ai/quiz` — `{layer?, region?, n}` → quiz JSON
- `GET/POST /api/quizzes`, `GET /api/quizzes/<id>` — custom quiz builder storage
- `GET  /api/game/cities` — random targets for the geog game
- `GET/POST /api/scores` — high-score table
- `POST /api/export/pdf` — `{title, year, layers[], map_png}` → PDF file
- `GET  /api/export/population/<year>` — analysis table JSON

All educational data (populations, Aral Sea shoreline, climate anomalies) is
simplified and approximate — suitable for classroom use, not for research.
