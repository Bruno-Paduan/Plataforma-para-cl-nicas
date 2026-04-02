import Database from 'better-sqlite3';

const db = new Database('clinica.db');

db.pragma('foreign_keys = ON');

const schema = `
CREATE TABLE IF NOT EXISTS convenios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  codigo TEXT
);

CREATE TABLE IF NOT EXISTS pacientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  convenio_id INTEGER,
  numero_carteirinha TEXT,
  FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS atendimentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  convenio_id INTEGER,
  tipo TEXT NOT NULL CHECK (tipo IN ('PARTICULAR', 'CONVENIO')),
  status TEXT NOT NULL DEFAULT 'AGENDADO' CHECK (status IN ('AGENDADO', 'CONCLUIDO', 'CANCELADO')),
  data_hora TEXT NOT NULL,
  observacoes TEXT,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE SET NULL
);
`;

db.exec(schema);

export default db;
