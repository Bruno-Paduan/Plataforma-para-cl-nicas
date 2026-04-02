import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.get('/', (_req, res) => {
  const convenios = db.prepare('SELECT * FROM convenios ORDER BY nome ASC').all();
  res.json(convenios);
});

router.post('/', (req, res) => {
  const { nome, codigo } = req.body;

  if (!nome?.trim()) {
    return res.status(400).json({ message: 'O nome do convênio é obrigatório.' });
  }

  const result = db
    .prepare('INSERT INTO convenios (nome, codigo) VALUES (?, ?)')
    .run(nome.trim(), codigo?.trim() || null);

  const convenio = db.prepare('SELECT * FROM convenios WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(convenio);
});

export default router;
