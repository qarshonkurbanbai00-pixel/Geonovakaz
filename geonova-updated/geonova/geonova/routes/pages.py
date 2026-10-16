from flask import Blueprint, render_template

bp = Blueprint("pages", __name__)


@bp.get("/")
def index():
    return render_template("index.html", page="map")


@bp.get("/geog")
def geog():
    return render_template("geog.html", page="geog")


@bp.get("/teacher")
def teacher():
    return render_template("teacher.html", page="teacher")


@bp.get("/quiz")
def quiz():
    return render_template("quiz.html", page="quiz")
