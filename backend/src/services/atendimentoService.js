import db from '../db/database.js';

const allowedTransitions = {
  AGENDADO: ['CONCLUIDO', 'CANCELADO'],
  CONCLUIDO: [],
  CANCELADO: []
};

export function createAtendimento({ pacienteId, tipo, dataHora, observacoes }) {
  const paciente = db
    .prepare('SELECT id, convenio_id FROM pacientes WHERE id = ?')
    .get(pacienteId);

  if (!paciente) {
    throw new Error('Paciente não encontrado.');
  }

  let convenioId = null;
  if (tipo === 'CONVENIO') {
    if (!paciente.convenio_id) {
      throw new Error('Paciente não possui convênio vinculado.');
    }
    convenioId = paciente.convenio_id;
  }

  const result = db
    .prepare(
      `INSERT INTO atendimentos (paciente_id, convenio_id, tipo, status, data_hora, observacoes)
       VALUES (?, ?, ?, 'AGENDADO', ?, ?)`
    )
    .run(pacienteId, convenioId, tipo, dataHora, observacoes ?? null);

  return db.prepare('SELECT * FROM atendimentos WHERE id = ?').get(result.lastInsertRowid);
}

export function updateAtendimentoStatus({ atendimentoId, novoStatus }) {
  const atendimento = db
    .prepare('SELECT id, status FROM atendimentos WHERE id = ?')
    .get(atendimentoId);

  if (!atendimento) {
    throw new Error('Atendimento não encontrado.');
  }

  const canTransition = allowedTransitions[atendimento.status]?.includes(novoStatus);
  if (!canTransition) {
    throw new Error(
      `Transição inválida: ${atendimento.status} -> ${novoStatus}. Permitido apenas AGENDADO -> CONCLUIDO/CANCELADO.`
    );
  }

  db.prepare('UPDATE atendimentos SET status = ? WHERE id = ?').run(novoStatus, atendimentoId);
  return db.prepare('SELECT * FROM atendimentos WHERE id = ?').get(atendimentoId);
}

export function listAtendimentosParaFaturamento() {
  return db
    .prepare(
      `SELECT a.*, p.nome AS paciente_nome, c.nome AS convenio_nome
       FROM atendimentos a
       JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN convenios c ON c.id = a.convenio_id
       WHERE a.status = 'CONCLUIDO' AND a.tipo = 'CONVENIO'
       ORDER BY a.data_hora ASC`
    )
    .all();
}
