const API_BASE = 'http://localhost:3001';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erro na requisição');
  }

  return response.json();
}

export const api = {
  listConvenios: () => request('/convenios'),
  createConvenio: (payload) =>
    request('/convenios', { method: 'POST', body: JSON.stringify(payload) }),

  listPacientes: () => request('/pacientes'),
  createPaciente: (payload) =>
    request('/pacientes', { method: 'POST', body: JSON.stringify(payload) }),

  listAtendimentos: () => request('/atendimentos'),
  createAtendimento: (payload) =>
    request('/atendimentos', { method: 'POST', body: JSON.stringify(payload) }),
  updateAtendimentoStatus: (id, novoStatus) =>
    request(`/atendimentos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ novoStatus })
    })
};
