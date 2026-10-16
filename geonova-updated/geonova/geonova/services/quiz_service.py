"""SQLite persistence: custom quizzes (Teacher Builder) + game high scores."""
import json
import sqlite3
import time

SCHEMA = """
CREATE TABLE IF NOT EXISTS custom_quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT DEFAULT 'Мұғалім',
    questions TEXT NOT NULL,          -- JSON array
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    duration_sec REAL DEFAULT 0,
    mode TEXT DEFAULT 'find_city',
    created_at REAL NOT NULL
);
"""


def _connect(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path):
    with _connect(db_path) as conn:
        conn.executescript(SCHEMA)


def add_custom_quiz(db_path, title, author, questions):
    with _connect(db_path) as conn:
        cur = conn.execute(
            "INSERT INTO custom_quizzes (title, author, questions, created_at) VALUES (?,?,?,?)",
            (title, author or "Мұғалім", json.dumps(questions, ensure_ascii=False), time.time()))
        return cur.lastrowid


def list_custom_quizzes(db_path):
    with _connect(db_path) as conn:
        rows = conn.execute("SELECT * FROM custom_quizzes ORDER BY created_at DESC").fetchall()
    out = []
    for r in rows:
        out.append({"id": r["id"], "title": r["title"], "author": r["author"],
                    "questions": json.loads(r["questions"]), "created_at": r["created_at"]})
    return out


def get_custom_quiz(db_path, quiz_id):
    with _connect(db_path) as conn:
        r = conn.execute("SELECT * FROM custom_quizzes WHERE id=?", (quiz_id,)).fetchone()
    if not r:
        return None
    return {"id": r["id"], "title": r["title"], "author": r["author"],
            "questions": json.loads(r["questions"])}


def save_score(db_path, player, score, total, duration_sec, mode):
    with _connect(db_path) as conn:
        cur = conn.execute(
            "INSERT INTO scores (player, score, total, duration_sec, mode, created_at) VALUES (?,?,?,?,?,?)",
            (player or "Оқушы", int(score), int(total), float(duration_sec or 0), mode, time.time()))
        return cur.lastrowid


def top_scores(db_path, limit=10):
    with _connect(db_path) as conn:
        rows = conn.execute(
            "SELECT player, score, total, duration_sec, mode, created_at FROM scores "
            "ORDER BY score DESC, duration_sec ASC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]
