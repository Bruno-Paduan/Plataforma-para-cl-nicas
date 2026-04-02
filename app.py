from __future__ import annotations

import json
import os
import sqlite3
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent
DATABASE = os.getenv("DATABASE_PATH", str(BASE_DIR / "database.db"))


def get_db() -> sqlite3.Connection:
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db


def init_db() -> None:
    with get_db() as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS profissionais (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                especialidade TEXT NOT NULL,
                percentual_repasse REAL NOT NULL CHECK(percentual_repasse >= 0 AND percentual_repasse <= 100),
                clinica_id INTEGER NOT NULL
            )
            """
        )
        db.commit()


def validate_payload(payload: dict) -> tuple[dict | None, tuple[dict, int] | None]:
    required_fields = ["nome", "especialidade", "percentual_repasse", "clinica_id"]
    missing = [field for field in required_fields if field not in payload]
    if missing:
        return None, ({"error": f"Campos obrigatórios ausentes: {', '.join(missing)}"}, 400)

    try:
        percentual_repasse = float(payload["percentual_repasse"])
    except (TypeError, ValueError):
        return None, ({"error": "percentual_repasse deve ser numérico"}, 400)

    if percentual_repasse < 0 or percentual_repasse > 100:
        return None, ({"error": "percentual_repasse deve estar entre 0 e 100"}, 400)

    try:
        clinica_id = int(payload["clinica_id"])
    except (TypeError, ValueError):
        return None, ({"error": "clinica_id deve ser inteiro"}, 400)

    data = {
        "nome": str(payload["nome"]).strip(),
        "especialidade": str(payload["especialidade"]).strip(),
        "percentual_repasse": percentual_repasse,
        "clinica_id": clinica_id,
    }
    if not data["nome"] or not data["especialidade"]:
        return None, ({"error": "nome e especialidade não podem ser vazios"}, 400)

    return data, None


def create_profissional(payload: dict) -> tuple[dict, int]:
    data, error = validate_payload(payload)
    if error:
        return error

    with get_db() as db:
        cursor = db.execute(
            """
            INSERT INTO profissionais (nome, especialidade, percentual_repasse, clinica_id)
            VALUES (?, ?, ?, ?)
            """,
            (data["nome"], data["especialidade"], data["percentual_repasse"], data["clinica_id"]),
        )
        db.commit()

    return {"id": cursor.lastrowid, **data}, 201


def list_profissionais(clinica_id: int | None) -> tuple[dict | list[dict], int]:
    if clinica_id is None:
        return {"error": "Parâmetro clinica_id é obrigatório"}, 400

    with get_db() as db:
        rows = db.execute(
            """
            SELECT id, nome, especialidade, percentual_repasse, clinica_id
            FROM profissionais
            WHERE clinica_id = ?
            ORDER BY id ASC
            """,
            (clinica_id,),
        ).fetchall()

    return [dict(row) for row in rows], 200


class ProfissionaisHandler(BaseHTTPRequestHandler):
    def _send_json(self, payload: dict | list[dict], status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/profissionais":
            self._send_json({"error": "Not Found"}, 404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_length) if content_length > 0 else b"{}"
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send_json({"error": "JSON inválido"}, 400)
            return

        response, status = create_profissional(payload)
        self._send_json(response, status)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path != "/profissionais":
            self._send_json({"error": "Not Found"}, 404)
            return

        params = parse_qs(parsed.query)
        clinica_id = params.get("clinica_id", [None])[0]
        try:
            clinica_id_int = int(clinica_id) if clinica_id is not None else None
        except ValueError:
            self._send_json({"error": "clinica_id deve ser inteiro"}, 400)
            return

        response, status = list_profissionais(clinica_id_int)
        self._send_json(response, status)


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    init_db()
    server = HTTPServer((host, port), ProfissionaisHandler)
    print(f"Servidor em http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
