import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('clinic.db');

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS clinics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS professionals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinica_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  FOREIGN KEY (clinica_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinica_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','secretaria','profissional')),
  professional_id INTEGER,
  FOREIGN KEY (clinica_id) REFERENCES clinics(id),
  FOREIGN KEY (professional_id) REFERENCES professionals(id)
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinica_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  FOREIGN KEY (clinica_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinica_id INTEGER NOT NULL,
  patient_id INTEGER NOT NULL,
  professional_id INTEGER NOT NULL,
  appointment_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('agendado','concluido','cancelado')),
  type TEXT NOT NULL,
  value REAL NOT NULL,
  FOREIGN KEY (clinica_id) REFERENCES clinics(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (professional_id) REFERENCES professionals(id)
);
`);

const clinicCount = db.prepare('SELECT COUNT(*) as count FROM clinics').get().count;
if (clinicCount === 0) {
  const insertClinic = db.prepare('INSERT INTO clinics (name) VALUES (?)');
  const c1 = insertClinic.run('Clínica Vida').lastInsertRowid;
  const c2 = insertClinic.run('Clínica Equilíbrio').lastInsertRowid;

  const insertProfessional = db.prepare('INSERT INTO professionals (clinica_id, name, specialty) VALUES (?,?,?)');
  const p1 = insertProfessional.run(c1, 'Dr. João Lima', 'Cardiologia').lastInsertRowid;
  insertProfessional.run(c1, 'Dra. Maria Souza', 'Psicologia');
  insertProfessional.run(c2, 'Dr. Pedro Alves', 'Ortopedia');

  const insertUser = db.prepare(
    'INSERT INTO users (clinica_id, name, email, password_hash, role, professional_id) VALUES (?,?,?,?,?,?)'
  );

  const pass = bcrypt.hashSync('123456', 10);
  insertUser.run(c1, 'Admin Vida', 'admin@vida.com', pass, 'admin', null);
  insertUser.run(c1, 'Secretária Vida', 'secretaria@vida.com', pass, 'secretaria', null);
  insertUser.run(c1, 'Dr. João Lima', 'joao@vida.com', pass, 'profissional', p1);
  insertUser.run(c2, 'Admin Equilíbrio', 'admin@equilibrio.com', pass, 'admin', null);

  const insertPatient = db.prepare('INSERT INTO patients (clinica_id, name, phone, birth_date) VALUES (?,?,?,?)');
  const pat1 = insertPatient.run(c1, 'Ana Costa', '(11) 99999-1000', '1990-01-10').lastInsertRowid;

  db.prepare(
    `INSERT INTO appointments (clinica_id, patient_id, professional_id, appointment_date, status, type, value)
     VALUES (?,?,?,?,?,?,?)`
  ).run(c1, pat1, p1, new Date().toISOString(), 'agendado', 'Consulta', 250);
}

export default db;
