import { useState } from 'react';

export default function PacientesPage({ pacientes, convenios, onCreate }) {
  const [nome, setNome] = useState('');
  const [convenioId, setConvenioId] = useState('');
  const [numeroCarteirinha, setNumeroCarteirinha] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    await onCreate({
      nome,
      convenioId: convenioId ? Number(convenioId) : null,
      numeroCarteirinha
    });
    setNome('');
    setConvenioId('');
    setNumeroCarteirinha('');
  };

  return (
    <section>
      <h2>Pacientes</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>

        <label>
          Convênio
          <select value={convenioId} onChange={(e) => setConvenioId(e.target.value)}>
            <option value="">Particular (sem convênio)</option>
            {convenios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Número da carteirinha
          <input
            value={numeroCarteirinha}
            onChange={(e) => setNumeroCarteirinha(e.target.value)}
            placeholder="Preencha quando houver convênio"
          />
        </label>

        <button type="submit">Salvar paciente</button>
      </form>

      <ul>
        {pacientes.map((paciente) => (
          <li key={paciente.id}>
            {paciente.nome} - {paciente.convenio_nome || 'Particular'}
            {paciente.numero_carteirinha ? ` | Carteirinha: ${paciente.numero_carteirinha}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
