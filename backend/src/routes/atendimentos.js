import { Router } from 'express';
import {
  createAtendimento,
  listAtendimentosParaFaturamento,
  updateAtendimentoStatus
} from '../services/atendimentoService.js';
import db from '../db/database.js';

const router = Router();

router.get('/', (_req, res) => {
  const atendimentos = db
    .prepare(
      `SELECT a.*, p.nome AS paciente_nome, c.nome AS convenio_nome
       FROM atendimentos a
       JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN convenios c ON c.id = a.convenio_id
       ORDER BY a.data_hora DESC`
    )
    .all();

  res.json(atendimentos);
});

router.post('/', (req, res) => {
  try {
    const { pacienteId, tipo, dataHora, observacoes } = req.body;
    if (!pacienteId || !tipo || !dataHora) {
      return res.status(400).json({ message: 'pacienteId, tipo e dataHora são obrigatórios.' });
    }

    if (!['PARTICULAR', 'CONVENIO'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo inválido. Use PARTICULAR ou CONVENIO.' });
    }

    const atendimento = createAtendimento({ pacienteId, tipo, dataHora, observacoes });
    return res.status(201).json(atendimento);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { novoStatus } = req.body;
    const atendimento = updateAtendimentoStatus({
      atendimentoId: Number(req.params.id),
      novoStatus
    });

    return res.json(atendimento);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/faturamento', (_req, res) => {
  const itens = listAtendimentosParaFaturamento();
  res.json(itens);
});

export default router;
