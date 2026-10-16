"""GeoNova — Kazakhstan Educational GIS Platform (application factory)."""
import os

from flask import Flask


def create_app(config_object: str = "geonova.config.Config") -> Flask:
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )
    app.config.from_object(config_object)
    # Keep Cyrillic (Kazakh/Russian) readable in JSON responses.
    app.json.ensure_ascii = False

    db_path = app.config["DATABASE"]
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    from .services.quiz_service import init_db
    init_db(db_path)

    from .routes import api_ai, api_export, api_layers, api_quiz, pages
    app.register_blueprint(pages.bp)
    app.register_blueprint(api_layers.bp, url_prefix="/api")
    app.register_blueprint(api_ai.bp, url_prefix="/api/ai")
    app.register_blueprint(api_quiz.bp, url_prefix="/api")
    app.register_blueprint(api_export.bp, url_prefix="/api/export")

    @app.context_processor
    def inject_meta():
        return {"app_name": "GeoNova", "app_tagline": "Қазақстанның білім беру ГИС платформасы"}

    return app
