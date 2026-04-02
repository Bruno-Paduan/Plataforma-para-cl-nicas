import os
import sqlite3
from contextlib import closing
from datetime import datetime

from flask import Flask, g, redirect, render_template, request, session, url_for, flash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "clinica.db")

app = Flask(__name__)
app.config["SECRET_KEY"] = "dev-secret-key-change-me"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DATABASE)
    with closing(db) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                clinica_id INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS pacientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                telefone TEXT NOT NULL,
                data_nascimento TEXT NOT NULL,
                tipo TEXT NOT NULL CHECK(tipo IN ('particular', 'convenio')),
                convenio TEXT,
                clinica_id INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if total_users == 0:
            conn.executemany(
                "INSERT INTO users (nome, clinica_id) VALUES (?, ?)",
                [
                    ("Alice", 1),
                    ("Bruno", 1),
                    ("Carla", 2),
                ],
            )
        conn.commit()


def parse_date(date_text):
    try:
        datetime.strptime(date_text, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None

    db = get_db()
    user = db.execute("SELECT id, nome, clinica_id FROM users WHERE id = ?", (user_id,)).fetchone()
    return user


init_db()

@app.before_request
def require_login():
    if request.endpoint in {"login", "static"}:
        return

    user = get_current_user()
    if user is None:
        return redirect(url_for("login"))


@app.route("/", methods=["GET"])
def home():
    return redirect(url_for("lista_pacientes"))


@app.route("/login", methods=["GET", "POST"])
def login():
    db = get_db()
    users = db.execute("SELECT id, nome, clinica_id FROM users ORDER BY id").fetchall()

    if request.method == "POST":
        user_id = request.form.get("user_id", type=int)
        user = db.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()

        if user:
            session.clear()
            session["user_id"] = user_id
            return redirect(url_for("lista_pacientes"))

        flash("Usuário inválido.", "error")

    return render_template("login.html", users=users)


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/pacientes", methods=["GET"])
def lista_pacientes():
    user = get_current_user()
    db = get_db()

    pacientes = db.execute(
        """
        SELECT id, nome, telefone, data_nascimento, tipo, convenio, clinica_id, created_at
        FROM pacientes
        WHERE clinica_id = ?
        ORDER BY id DESC
        """,
        (user["clinica_id"],),
    ).fetchall()

    return render_template("pacientes/lista.html", pacientes=pacientes, user=user)


@app.route("/pacientes/novo", methods=["GET", "POST"])
def novo_paciente():
    user = get_current_user()

    if request.method == "POST":
        nome = request.form.get("nome", "").strip()
        telefone = request.form.get("telefone", "").strip()
        data_nascimento = request.form.get("data_nascimento", "").strip()
        tipo = request.form.get("tipo", "").strip()
        convenio = request.form.get("convenio", "").strip()
        clinica_id = request.form.get("clinica_id", type=int)

        errors = []

        if not nome:
            errors.append("Nome é obrigatório.")
        if not telefone:
            errors.append("Telefone é obrigatório.")
        if not data_nascimento or not parse_date(data_nascimento):
            errors.append("Data de nascimento inválida. Use o formato YYYY-MM-DD.")
        if tipo not in {"particular", "convenio"}:
            errors.append("Tipo deve ser particular ou convenio.")
        if tipo == "convenio" and not convenio:
            errors.append("Convênio é obrigatório quando o tipo é convênio.")
        if clinica_id != user["clinica_id"]:
            errors.append("Você só pode cadastrar pacientes da sua clínica.")

        if errors:
            for err in errors:
                flash(err, "error")
            return render_template("pacientes/novo.html", user=user)

        db = get_db()
        db.execute(
            """
            INSERT INTO pacientes (nome, telefone, data_nascimento, tipo, convenio, clinica_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (nome, telefone, data_nascimento, tipo, convenio if convenio else None, user["clinica_id"]),
        )
        db.commit()

        flash("Paciente cadastrado com sucesso.", "success")
        return redirect(url_for("lista_pacientes"))

    return render_template("pacientes/novo.html", user=user)


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
