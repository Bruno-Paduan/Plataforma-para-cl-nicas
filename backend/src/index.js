import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { allowRoles, authRequired } from './middleware.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db
    .prepare('SELECT id, clinica_id, name, email, password_hash, role, professional_id FROM users WHERE email = ?')
    .get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const payload = {
    id: user.id,
    clinica_id: user.clinica_id,
    name: user.name,
    role: user.role,
    professional_id: user.professional_id
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, user: payload });
});

app.get('/me', authRequired, (req, res) => res.json(req.user));

app.get('/patients', authRequired, (req, res) => {
  const { clinica_id, role, professional_id } = req.user;

  if (role === 'profissional') {
    const rows = db
      .prepare(
        `SELECT DISTINCT p.* FROM patients p
         JOIN appointments a ON a.patient_id = p.id
         WHERE p.clinica_id = ? AND a.professional_id = ?`
      )
      .all(clinica_id, professional_id);
    return res.json(rows);
  }

  return res.json(db.prepare('SELECT * FROM patients WHERE clinica_id = ? ORDER BY id DESC').all(clinica_id));
});

app.post('/patients', authRequired, allowRoles('admin', 'secretaria'), (req, res) => {
  const { name, phone, birth_date } = req.body;
  if (!name || !phone || !birth_date) return res.status(400).json({ error: 'Campos obrigatórios faltando' });

  const result = db
    .prepare('INSERT INTO patients (clinica_id, name, phone, birth_date) VALUES (?,?,?,?)')
    .run(req.user.clinica_id, name, phone, birth_date);

  return res.status(201).json({ id: result.lastInsertRowid, name, phone, birth_date });
});

app.get('/professionals', authRequired, (req, res) => {
  const { clinica_id, role, professional_id } = req.user;
  if (role === 'profissional') {
    const prof = db.prepare('SELECT * FROM professionals WHERE id = ? AND clinica_id = ?').get(professional_id, clinica_id);
    return res.json(prof ? [prof] : []);
  }

  return res.json(db.prepare('SELECT * FROM professionals WHERE clinica_id = ? ORDER BY id DESC').all(clinica_id));
});

app.post('/professionals', authRequired, allowRoles('admin'), (req, res) => {
  const { name, specialty } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

  const result = db
    .prepare('INSERT INTO professionals (clinica_id, name, specialty) VALUES (?,?,?)')
    .run(req.user.clinica_id, name, specialty || null);

  return res.status(201).json({ id: result.lastInsertRowid, name, specialty });
});

app.get('/appointments', authRequired, (req, res) => {
  const { clinica_id, role, professional_id } = req.user;
  const params = [clinica_id];
  let where = 'a.clinica_id = ?';

  if (role === 'profissional') {
    where += ' AND a.professional_id = ?';
    params.push(professional_id);
  }

  const rows = db
    .prepare(
      `SELECT a.*, p.name AS patient_name, pr.name AS professional_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN professionals pr ON pr.id = a.professional_id
       WHERE ${where}
       ORDER BY a.appointment_date DESC`
    )
    .all(...params);

  return res.json(rows);
});

app.post('/appointments', authRequired, allowRoles('admin', 'secretaria'), (req, res) => {
  const { patient_id, professional_id, appointment_date, status, type, value } = req.body;
  if (!patient_id || !professional_id || !appointment_date || !status || !type || value === undefined) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const patient = db.prepare('SELECT id FROM patients WHERE id = ? AND clinica_id = ?').get(patient_id, req.user.clinica_id);
  const prof = db
    .prepare('SELECT id FROM professionals WHERE id = ? AND clinica_id = ?')
    .get(professional_id, req.user.clinica_id);

  if (!patient || !prof) return res.status(400).json({ error: 'Paciente/profissional inválido para a clínica' });

  const result = db
    .prepare(
      `INSERT INTO appointments (clinica_id, patient_id, professional_id, appointment_date, status, type, value)
       VALUES (?,?,?,?,?,?,?)`
    )
    .run(req.user.clinica_id, patient_id, professional_id, appointment_date, status, type, Number(value));

  return res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/finance/summary', authRequired, (req, res) => {
  const { clinica_id, role, professional_id } = req.user;
  const params = [clinica_id];
  let where = 'clinica_id = ?';
  if (role === 'profissional') {
    where += ' AND professional_id = ?';
    params.push(professional_id);
  }

  const totals = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'concluido' THEN value END), 0) AS received,
        COALESCE(SUM(CASE WHEN status = 'agendado' THEN value END), 0) AS projected,
        COUNT(*) AS total_appointments
       FROM appointments
       WHERE ${where}`
    )
    .get(...params);

  res.json(totals);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
