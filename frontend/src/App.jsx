import { useEffect, useState } from 'react';
import { api } from './api/client';
import MenuTabs from './components/MenuTabs';
import ConveniosPage from './pages/ConveniosPage';
import PacientesPage from './pages/PacientesPage';
import AtendimentosPage from './pages/AtendimentosPage';

export default function App() {
  const [tab, setTab] = useState('Pacientes');
  const [convenios, setConvenios] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [atendimentos, setAtendimentos] = useState([]);

  const loadData = async () => {
    const [conveniosRes, pacientesRes, atendimentosRes] = await Promise.all([
      api.listConvenios(),
      api.listPacientes(),
      api.listAtendimentos()
    ]);

    setConvenios(conveniosRes);
    setPacientes(pacientesRes);
    setAtendimentos(atendimentosRes);
  };

  useEffect(() => {
    loadData();
  }, []);

  const safeAction = async (action) => {
    try {
      await action();
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1>Sistema da Clínica</h1>
      <MenuTabs currentTab={tab} onChange={setTab} />

      {tab === 'Convênios' && (
        <ConveniosPage convenios={convenios} onCreate={(payload) => safeAction(() => api.createConvenio(payload))} />
      )}

      {tab === 'Pacientes' && (
        <PacientesPage
          pacientes={pacientes}
          convenios={convenios}
          onCreate={(payload) => safeAction(() => api.createPaciente(payload))}
        />
      )}

      {tab === 'Atendimentos' && (
        <AtendimentosPage
          pacientes={pacientes}
          atendimentos={atendimentos}
          onCreate={(payload) => safeAction(() => api.createAtendimento(payload))}
          onChangeStatus={(id, novoStatus) => safeAction(() => api.updateAtendimentoStatus(id, novoStatus))}
        />
      )}
    </main>
  );
}
