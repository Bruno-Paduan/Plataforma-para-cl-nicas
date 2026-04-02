import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.get('/', (_req, res) => {
  const pacientes = db
    .prepare(
      `SELECT p.*, c.nome AS convenio_nome
       FROM pacientes p
       LEFT JOIN convenios c ON c.id = p.convenio_id
       ORDER BY p.nome ASC`
    )
    .all();

  res.json(pacientes);
});

router.post('/', (req, res) => {
  const { nome, convenioId, numeroCarteirinha } = req.body;

  if (!nome?.trim()) {
    return res.status(400).json({ message: 'O nome do paciente é obrigatório.' });
  }

  const result = db
    .prepare(
      `INSERT INTO pacientes (nome, convenio_id, numero_carteirinha)
       VALUES (?, ?, ?)`
    )
    .run(nome.trim(), convenioId || null, numeroCarteirinha?.trim() || null);

  const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(paciente);
});

export default router;
