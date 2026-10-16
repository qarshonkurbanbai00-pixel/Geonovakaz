import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class Config:
    SECRET_KEY = os.environ.get("GEONOVA_SECRET", "geonova-dev-secret-change-me")
    DATABASE = os.environ.get(
        "GEONOVA_DB", os.path.join(BASE_DIR, "instance", "geonova.db")
    )
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # allow map snapshot uploads for PDF export
