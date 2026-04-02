import { useState } from 'react';

export default function AtendimentosPage({ pacientes, atendimentos, onCreate, onChangeStatus }) {
  const [pacienteId, setPacienteId] = useState('');
  const [tipo, setTipo] = useState('PARTICULAR');
  const [dataHora, setDataHora] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    await onCreate({ pacienteId: Number(pacienteId), tipo, dataHora });
    setDataHora('');
  };

  return (
    <section>
      <h2>Atendimentos</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <label>
          Paciente
          <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required>
            <option value="">Selecione</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="PARTICULAR">PARTICULAR</option>
            <option value="CONVENIO">CONVENIO</option>
          </select>
        </label>

        <label>
          Data e hora
          <input
            type="datetime-local"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            required
          />
        </label>

        <button type="submit">Criar atendimento</button>
      </form>

      <ul>
        {atendimentos.map((a) => (
          <li key={a.id}>
            #{a.id} - {a.paciente_nome} - {a.tipo} - {a.status}
            {a.convenio_nome ? ` (${a.convenio_nome})` : ''}
            {a.status === 'AGENDADO' && (
              <>
                {' '}
                <button type="button" onClick={() => onChangeStatus(a.id, 'CONCLUIDO')}>
                  Concluir
                </button>
                <button type="button" onClick={() => onChangeStatus(a.id, 'CANCELADO')}>
                  Cancelar
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
