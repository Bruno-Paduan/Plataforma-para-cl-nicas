import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = 'http://localhost:4000';

function useApi(token) {
  return useMemo(
    () => async (path, options = {}) => {
      const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na requisição');
      return data;
    },
    [token]
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@vida.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no login');
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card login">
      <h1>Sistema de Clínicas</h1>
      <p>Usuários de exemplo: admin@vida.com, secretaria@vida.com, joao@vida.com (senha: 123456)</p>
      <form onSubmit={submit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" type="password" />
        <button>Entrar</button>
      </form>
      {error && <span className="error">{error}</span>}
    </div>
  );
}

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('session') || 'null'));
  const [patients, setPatients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [finance, setFinance] = useState({ received: 0, projected: 0, total_appointments: 0 });
  const [tab, setTab] = useState('patients');
  const [error, setError] = useState('');

  const api = useApi(session?.token);
  const role = session?.user?.role;

  async function loadAll() {
    if (!session) return;
    try {
      const [pat, prof, app, fin] = await Promise.all([
        api('/patients'),
        api('/professionals'),
        api('/appointments'),
        api('/finance/summary')
      ]);
      setPatients(pat);
      setProfessionals(prof);
      setAppointments(app);
      setFinance(fin);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, [session]);

  function handleLogin(data) {
    setSession(data);
    localStorage.setItem('session', JSON.stringify(data));
  }

  function logout() {
    localStorage.removeItem('session');
    setSession(null);
  }

  async function createPatient(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    await api('/patients', {
      method: 'POST',
      body: JSON.stringify({
        name: form.get('name'),
        phone: form.get('phone'),
        birth_date: form.get('birth_date')
      })
    });
    e.target.reset();
    loadAll();
  }

  async function createProfessional(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    await api('/professionals', {
      method: 'POST',
      body: JSON.stringify({
        name: form.get('name'),
        specialty: form.get('specialty')
      })
    });
    e.target.reset();
    loadAll();
  }

  async function createAppointment(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    await api('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: Number(form.get('patient_id')),
        professional_id: Number(form.get('professional_id')),
        appointment_date: form.get('appointment_date'),
        status: form.get('status'),
        type: form.get('type'),
        value: Number(form.get('value'))
      })
    });
    e.target.reset();
    loadAll();
  }

  if (!session) return <Login onLogin={handleLogin} />;

  const canManagePatients = role !== 'profissional';
  const canManageProfessionals = role === 'admin';
  const canManageAppointments = role !== 'profissional';

  return (
    <div className="container">
      <header>
        <h2>Clínica #{session.user.clinica_id}</h2>
        <div>
          <strong>{session.user.name}</strong> ({role})
          <button onClick={logout}>Sair</button>
        </div>
      </header>

      <nav>
        <button onClick={() => setTab('patients')}>Pacientes</button>
        <button onClick={() => setTab('professionals')}>Profissionais</button>
        <button onClick={() => setTab('appointments')}>Atendimentos</button>
        <button onClick={() => setTab('finance')}>Financeiro</button>
      </nav>

      {error && <p className="error">{error}</p>}

      {tab === 'patients' && (
        <section className="card">
          <h3>Pacientes</h3>
          {canManagePatients && (
            <form onSubmit={createPatient}>
              <input name="name" placeholder="Nome" required />
              <input name="phone" placeholder="Telefone" required />
              <input name="birth_date" type="date" required />
              <button>Cadastrar</button>
            </form>
          )}
          <ul>{patients.map((p) => <li key={p.id}>{p.name} - {p.phone} - {p.birth_date}</li>)}</ul>
        </section>
      )}

      {tab === 'professionals' && (
        <section className="card">
          <h3>Profissionais</h3>
          {canManageProfessionals && (
            <form onSubmit={createProfessional}>
              <input name="name" placeholder="Nome" required />
              <input name="specialty" placeholder="Especialidade" />
              <button>Cadastrar</button>
            </form>
          )}
          <ul>{professionals.map((p) => <li key={p.id}>{p.name} - {p.specialty || 'Sem especialidade'}</li>)}</ul>
        </section>
      )}

      {tab === 'appointments' && (
        <section className="card">
          <h3>Atendimentos</h3>
          {canManageAppointments && (
            <form onSubmit={createAppointment}>
              <select name="patient_id" required>
                <option value="">Paciente</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select name="professional_id" required>
                <option value="">Profissional</option>
                {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input name="appointment_date" type="datetime-local" required />
              <select name="status" required>
                <option value="agendado">Agendado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <input name="type" placeholder="Tipo" required />
              <input name="value" placeholder="Valor" type="number" step="0.01" required />
              <button>Cadastrar</button>
            </form>
          )}
          <ul>
            {appointments.map((a) => (
              <li key={a.id}>
                {a.patient_name} | {a.professional_name} | {a.status} | {a.type} | R$ {a.value}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'finance' && (
        <section className="card">
          <h3>Painel Financeiro</h3>
          <p>Total de atendimentos: {finance.total_appointments}</p>
          <p>Receita confirmada (concluído): R$ {Number(finance.received).toFixed(2)}</p>
          <p>Receita projetada (agendado): R$ {Number(finance.projected).toFixed(2)}</p>
        </section>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
