const API_BASE = window.API_BASE || '/api';

const state = {
  pacientes: [],
  convenios: [],
  procedimentos: [],
  atendimentos: [],
  faturamento: { particular: [], convenios: [] },
};

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Falha ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function setupNavigation() {
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      document.getElementById(btn.dataset.view).classList.add('active');
    });
  });
}

function convenioLabel(convenioId) {
  const c = state.convenios.find((x) => String(x.id) === String(convenioId));
  return c ? c.nome : 'Particular';
}

function fillSelect(selectId, items, placeholder) {
  const select = document.getElementById(selectId);
  select.innerHTML = '';
  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    select.appendChild(opt);
  }
  items.forEach((i) => {
    const opt = document.createElement('option');
    opt.value = i.id;
    opt.textContent = i.nome;
    select.appendChild(opt);
  });
}

async function loadConvenios() {
  state.convenios = await api('/convenios');

  fillSelect('paciente-convenio-select', state.convenios, 'Selecione um convênio');
  fillSelect('procedimento-convenio-select', state.convenios, 'Convênio');

  const tbody = document.getElementById('convenios-tbody');
  tbody.innerHTML = state.convenios
    .map((c) => `<tr><td>${c.nome}</td><td>${c.codigo}</td></tr>`)
    .join('');
}

async function loadProcedimentos() {
  state.procedimentos = await api('/convenios/procedimentos');
  const tbody = document.getElementById('procedimentos-tbody');
  tbody.innerHTML = state.procedimentos
    .map(
      (p) => `<tr>
        <td>${convenioLabel(p.convenioId)}</td>
        <td>${p.nome}</td>
        <td>${p.codigo}</td>
        <td>R$ ${Number(p.valor).toFixed(2)}</td>
      </tr>`,
    )
    .join('');
}

async function loadPacientes() {
  state.pacientes = await api('/pacientes');

  fillSelect('atendimento-paciente-select', state.pacientes, 'Paciente');

  const tbody = document.getElementById('pacientes-tbody');
  tbody.innerHTML = state.pacientes
    .map(
      (p) => `<tr>
        <td>${p.nome}</td>
        <td>${p.cpf}</td>
        <td>${p.particular ? 'Particular' : convenioLabel(p.convenioId)}</td>
        <td>${p.numeroCarteirinha || '-'}</td>
      </tr>`,
    )
    .join('');
}

async function loadAtendimentos() {
  state.atendimentos = await api('/atendimentos');
  const tbody = document.getElementById('atendimentos-tbody');

  tbody.innerHTML = state.atendimentos
    .map((a) => {
      const paciente = state.pacientes.find((p) => String(p.id) === String(a.pacienteId));
      return `<tr>
      <td>${paciente?.nome || '-'}</td>
      <td>${new Date(a.dataHora).toLocaleString('pt-BR')}</td>
      <td>${a.status}</td>
      <td>${a.particular ? 'Particular' : convenioLabel(a.convenioId)}</td>
      <td>
        <button class="action-btn done" onclick="concluirAtendimento('${a.id}')">Concluir atendimento</button>
        <button class="action-btn cancel" onclick="cancelarAtendimento('${a.id}')">Cancelar atendimento</button>
      </td>
    </tr>`;
    })
    .join('');
}

async function loadFaturamento() {
  state.faturamento = await api('/faturamento/resumo');

  const particular = document.getElementById('faturamento-particular');
  particular.innerHTML = state.faturamento.particular
    .map((i) => `<tr><td>${i.paciente}</td><td>R$ ${Number(i.valor).toFixed(2)}</td><td>${i.status}</td></tr>`)
    .join('');

  const convenios = document.getElementById('faturamento-convenios');
  convenios.innerHTML = state.faturamento.convenios
    .map((i) => `<tr><td>${i.convenio}</td><td>${i.quantidade}</td><td>R$ ${Number(i.valor).toFixed(2)}</td></tr>`)
    .join('');
}

function setupForms() {
  document.getElementById('paciente-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = Object.fromEntries(form.entries());
    payload.particular = Boolean(form.get('particular'));
    if (payload.particular) {
      payload.convenioId = null;
      payload.numeroCarteirinha = null;
    }

    await api('/pacientes', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    await loadPacientes();
  });

  document.getElementById('convenio-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    await api('/convenios', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    await loadConvenios();
  });

  document.getElementById('procedimento-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.valor = Number(payload.valor);
    await api('/convenios/procedimentos', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    await loadProcedimentos();
  });

  document.getElementById('atendimento-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());

    const paciente = state.pacientes.find((p) => String(p.id) === String(payload.pacienteId));

    payload.status = 'Agendado';
    payload.convenioId = paciente?.particular ? null : paciente?.convenioId || null;
    payload.particular = Boolean(paciente?.particular);
    payload.faturamento = {
      tipo: paciente?.particular ? 'PARTICULAR' : 'CONVENIO',
      numeroCarteirinha: paciente?.numeroCarteirinha || null,
      convenioId: payload.convenioId,
    };

    await api('/atendimentos', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    await loadAtendimentos();
    await loadFaturamento();
  });

  document.getElementById('refresh-pacientes').addEventListener('click', loadPacientes);
  document.getElementById('refresh-convenios').addEventListener('click', async () => {
    await loadConvenios();
    await loadProcedimentos();
  });
  document.getElementById('refresh-atendimentos').addEventListener('click', loadAtendimentos);

  const particularCheckbox = document.querySelector('input[name="particular"]');
  particularCheckbox.addEventListener('change', () => {
    const convenio = document.querySelector('select[name="convenioId"]');
    const carteira = document.querySelector('input[name="numeroCarteirinha"]');
    const disable = particularCheckbox.checked;
    convenio.disabled = disable;
    carteira.disabled = disable;
  });
}

window.concluirAtendimento = async (id) => {
  await api(`/atendimentos/${id}/concluir`, { method: 'PATCH' });
  await loadAtendimentos();
  await loadFaturamento();
};

window.cancelarAtendimento = async (id) => {
  await api(`/atendimentos/${id}/cancelar`, { method: 'PATCH' });
  await loadAtendimentos();
};

async function bootstrap() {
  setupNavigation();
  setupForms();

  await loadConvenios();
  await loadProcedimentos();
  await loadPacientes();
  await loadAtendimentos();
  await loadFaturamento();
}

bootstrap().catch((err) => {
  const area = document.querySelector('.content');
  const p = document.createElement('p');
  p.className = 'muted';
  p.textContent = `Erro ao carregar dados da API: ${err.message}`;
  area.prepend(p);
});
