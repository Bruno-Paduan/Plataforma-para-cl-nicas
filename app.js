const STORAGE_KEY = "painel_financeiro_pagamentos";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const hoje = new Date();
const mesPadrao = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

const elements = {
  filterClinicaId: document.getElementById("filterClinicaId"),
  filterMes: document.getElementById("filterMes"),
  totalAtendimentos: document.getElementById("totalAtendimentos"),
  totalFaturado: document.getElementById("totalFaturado"),
  totalParticular: document.getElementById("totalParticular"),
  totalConvenio: document.getElementById("totalConvenio"),
  pagamentoForm: document.getElementById("pagamentoForm"),
  pagamentosTabela: document.getElementById("pagamentosTabela"),
};

const getPagamentos = () => {
  const rawData = localStorage.getItem(STORAGE_KEY);
  if (!rawData) return [];

  try {
    const parsedData = JSON.parse(rawData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch {
    return [];
  }
};

const savePagamentos = (pagamentos) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pagamentos));
};

const paymentMatchesFilters = (payment, clinicaId, mesReferencia) => {
  const matchClinica = !clinicaId || payment.clinicaId === clinicaId;
  const matchMes = !mesReferencia || payment.dataAtendimento.startsWith(mesReferencia);
  return matchClinica && matchMes;
};

const render = () => {
  const clinicaId = elements.filterClinicaId.value.trim();
  const mesReferencia = elements.filterMes.value;

  const pagamentos = getPagamentos();
  const filtrados = pagamentos.filter((payment) =>
    paymentMatchesFilters(payment, clinicaId, mesReferencia),
  );

  const totalAtendimentos = filtrados.length;
  const totalFaturado = filtrados.reduce((total, item) => total + item.valor, 0);

  const totalParticular = filtrados
    .filter((item) => item.tipo === "particular")
    .reduce((total, item) => total + item.valor, 0);

  const totalConvenio = filtrados
    .filter((item) => item.tipo === "convenio")
    .reduce((total, item) => total + item.valor, 0);

  elements.totalAtendimentos.textContent = String(totalAtendimentos);
  elements.totalFaturado.textContent = formatCurrency(totalFaturado);
  elements.totalParticular.textContent = formatCurrency(totalParticular);
  elements.totalConvenio.textContent = formatCurrency(totalConvenio);

  elements.pagamentosTabela.innerHTML = "";

  filtrados
    .sort((a, b) => b.dataAtendimento.localeCompare(a.dataAtendimento))
    .forEach((item) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${item.clinicaId}</td>
        <td>${new Date(item.dataAtendimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
        <td>${item.tipo === "particular" ? "Particular" : "Convênio"}</td>
        <td class="status-${item.status}">${item.status === "pago" ? "Pago" : "Pendente"}</td>
        <td>${item.formaPagamento}</td>
        <td>${formatCurrency(item.valor)}</td>
      `;

      elements.pagamentosTabela.appendChild(tr);
    });
};

const handleSubmit = (event) => {
  event.preventDefault();

  const pagamento = {
    clinicaId: document.getElementById("clinicaId").value.trim(),
    dataAtendimento: document.getElementById("dataAtendimento").value,
    valor: Number(document.getElementById("valor").value),
    tipo: document.getElementById("tipo").value,
    status: document.getElementById("status").value,
    formaPagamento: document.getElementById("formaPagamento").value,
  };

  if (!pagamento.clinicaId || !pagamento.dataAtendimento || Number.isNaN(pagamento.valor)) {
    return;
  }

  const pagamentos = getPagamentos();
  pagamentos.push(pagamento);
  savePagamentos(pagamentos);

  elements.pagamentoForm.reset();
  render();
};

elements.filterMes.value = mesPadrao;

elements.filterClinicaId.addEventListener("input", render);

elements.filterMes.addEventListener("change", render);

elements.pagamentoForm.addEventListener("submit", handleSubmit);

render();
