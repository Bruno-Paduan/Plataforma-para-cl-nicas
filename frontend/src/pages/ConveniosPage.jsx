import { useState } from 'react';

export default function ConveniosPage({ convenios, onCreate }) {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    await onCreate({ nome, codigo });
    setNome('');
    setCodigo('');
  };

  return (
    <section>
      <h2>Convênios</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>

        <label>
          Código (opcional)
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        </label>

        <button type="submit">Salvar convênio</button>
      </form>

      <ul>
        {convenios.map((convenio) => (
          <li key={convenio.id}>
            {convenio.nome} {convenio.codigo ? `(${convenio.codigo})` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
