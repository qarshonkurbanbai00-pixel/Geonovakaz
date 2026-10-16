"""GeoNova entry point.

Dev:   python run.py
Prod:  gunicorn 'geonova:create_app()' --bind 0.0.0.0:8000
"""
from geonova import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
