const state = {
  insurances: [],
  patients: [],
  appointments: []
};

const elements = {
  tabs: document.querySelectorAll('.tab-button'),
  panels: document.querySelectorAll('.tab-panel'),

  insuranceForm: document.getElementById('insurance-form'),
  insuranceName: document.getElementById('insurance-name'),
  insuranceList: document.getElementById('insurance-list'),

  patientForm: document.getElementById('patient-form'),
  patientName: document.getElementById('patient-name'),
  patientCpf: document.getElementById('patient-cpf'),
  patientInsuranceFields: document.getElementById('insurance-fields'),
  patientInsuranceSelect: document.getElementById('patient-insurance'),
  patientCardNumber: document.getElementById('patient-card-number'),
  patientPlan: document.getElementById('patient-plan'),
  patientValidity: document.getElementById('patient-validity'),
  patientsList: document.getElementById('patients-list'),

  appointmentForm: document.getElementById('appointment-form'),
  appointmentPatient: document.getElementById('appointment-patient'),
  appointmentProfessional: document.getElementById('appointment-professional'),
  appointmentDateTime: document.getElementById('appointment-datetime'),
  appointmentTable: document.getElementById('appointments-table'),

  previewType: document.getElementById('preview-type'),
  previewInsurance: document.getElementById('preview-insurance'),
  previewCard: document.getElementById('preview-card')
};

function init() {
  bindTabSwitch();
  bindInsuranceForm();
  bindPatientForm();
  bindAppointmentForm();
  bindPatientTypeToggle();

  renderInsurances();
  renderPatients();
  renderPatientSelects();
  renderAppointments();
}

function bindTabSwitch() {
  elements.tabs.forEach((button) => {
    button.addEventListener('click', () => {
      elements.tabs.forEach((tab) => tab.classList.remove('active'));
      elements.panels.forEach((panel) => panel.classList.remove('active'));

      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });
}

function bindInsuranceForm() {
  elements.insuranceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = elements.insuranceName.value.trim();

    if (!name) return;

    state.insurances.push({
      id: crypto.randomUUID(),
      name
    });

    elements.insuranceForm.reset();
    renderInsurances();
    renderPatientSelects();
  });
}

function bindPatientTypeToggle() {
  document.querySelectorAll('input[name="patient-care-type"]').forEach((radio) => {
    radio.addEventListener('change', handlePatientTypeFields);
  });

  handlePatientTypeFields();
}

function getSelectedPatientType() {
  return document.querySelector('input[name="patient-care-type"]:checked').value;
}

function handlePatientTypeFields() {
  const isInsurance = getSelectedPatientType() === 'Convênio';
  elements.patientInsuranceFields.classList.toggle('hidden', !isInsurance);

  elements.patientInsuranceSelect.required = isInsurance;
  elements.patientCardNumber.required = isInsurance;

  if (!isInsurance) {
    elements.patientInsuranceSelect.value = '';
    elements.patientCardNumber.value = '';
    elements.patientPlan.value = '';
    elements.patientValidity.value = '';
  }
}

function bindPatientForm() {
  elements.patientForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const careType = getSelectedPatientType();
    const insuranceId = elements.patientInsuranceSelect.value;

    if (careType === 'Convênio' && (!insuranceId || !elements.patientCardNumber.value.trim())) {
      return;
    }

    state.patients.push({
      id: crypto.randomUUID(),
      name: elements.patientName.value.trim(),
      cpf: elements.patientCpf.value.trim(),
      careType,
      insuranceId: careType === 'Convênio' ? insuranceId : null,
      cardNumber: careType === 'Convênio' ? elements.patientCardNumber.value.trim() : null,
      plan: careType === 'Convênio' ? elements.patientPlan.value.trim() || null : null,
      validity: careType === 'Convênio' ? elements.patientValidity.value || null : null
    });

    elements.patientForm.reset();
    document.querySelector('input[name="patient-care-type"][value="Particular"]').checked = true;
    handlePatientTypeFields();

    renderPatients();
    renderPatientSelects();
  });
}

function bindAppointmentForm() {
  elements.appointmentPatient.addEventListener('change', updatePatientPreview);

  elements.appointmentForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const patient = state.patients.find((item) => item.id === elements.appointmentPatient.value);
    if (!patient) return;

    state.appointments.push({
      id: crypto.randomUUID(),
      patientId: patient.id,
      professional: elements.appointmentProfessional.value.trim(),
      datetime: elements.appointmentDateTime.value,
      status: 'Agendado',
      careType: patient.careType,
      insuranceId: patient.insuranceId,
      cardNumber: patient.cardNumber
    });

    elements.appointmentForm.reset();
    updatePatientPreview();
    renderAppointments();
  });
}

function renderInsurances() {
  elements.insuranceList.innerHTML = '';
  elements.patientInsuranceSelect.innerHTML = '<option value="">Selecione...</option>';

  if (!state.insurances.length) {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.textContent = 'Nenhum convênio cadastrado ainda.';
    elements.insuranceList.appendChild(li);
    return;
  }

  state.insurances.forEach((insurance) => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.textContent = insurance.name;
    elements.insuranceList.appendChild(li);

    const option = document.createElement('option');
    option.value = insurance.id;
    option.textContent = insurance.name;
    elements.patientInsuranceSelect.appendChild(option);
  });
}

function renderPatients() {
  elements.patientsList.innerHTML = '';

  if (!state.patients.length) {
    elements.patientsList.innerHTML = '<div class="list-item">Nenhum paciente cadastrado.</div>';
    return;
  }

  state.patients.forEach((patient) => {
    const div = document.createElement('div');
    div.className = 'list-item';

    const insuranceName = patient.insuranceId
      ? state.insurances.find((insurance) => insurance.id === patient.insuranceId)?.name || 'Convênio removido'
      : '-';

    div.innerHTML = `
      <strong>${patient.name}</strong><br />
      CPF: ${patient.cpf}<br />
      Tipo padrão: ${patient.careType}<br />
      Convênio: ${insuranceName}<br />
      Carteirinha: ${patient.cardNumber || '-'}
    `;

    elements.patientsList.appendChild(div);
  });
}

function renderPatientSelects() {
  elements.appointmentPatient.innerHTML = '<option value="">Selecione...</option>';

  state.patients.forEach((patient) => {
    const option = document.createElement('option');
    option.value = patient.id;
    option.textContent = `${patient.name} (${patient.cpf})`;
    elements.appointmentPatient.appendChild(option);
  });

  updatePatientPreview();
}

function updatePatientPreview() {
  const patient = state.patients.find((item) => item.id === elements.appointmentPatient.value);

  if (!patient) {
    elements.previewType.textContent = '-';
    elements.previewInsurance.textContent = '-';
    elements.previewCard.textContent = '-';
    return;
  }

  const insuranceName = patient.insuranceId
    ? state.insurances.find((insurance) => insurance.id === patient.insuranceId)?.name || 'Convênio removido'
    : '-';

  elements.previewType.textContent = patient.careType;
  elements.previewInsurance.textContent = insuranceName;
  elements.previewCard.textContent = patient.cardNumber || '-';
}

function setAppointmentStatus(id, status) {
  const appointment = state.appointments.find((item) => item.id === id);
  if (!appointment) return;

  appointment.status = status;
  renderAppointments();
}

function renderAppointments() {
  elements.appointmentTable.innerHTML = '';

  if (!state.appointments.length) {
    elements.appointmentTable.innerHTML = '<tr><td colspan="7">Nenhum atendimento cadastrado.</td></tr>';
    return;
  }

  state.appointments.forEach((appointment) => {
    const patient = state.patients.find((item) => item.id === appointment.patientId);
    const insuranceName = appointment.insuranceId
      ? state.insurances.find((insurance) => insurance.id === appointment.insuranceId)?.name || 'Convênio removido'
      : '-';

    const row = document.createElement('tr');

    const actions =
      appointment.status === 'Agendado'
        ? `
          <button data-action="concluir" data-id="${appointment.id}">Marcar como Concluído</button>
          <button class="danger" data-action="cancelar" data-id="${appointment.id}">Marcar como Cancelado</button>
        `
        : '<span>-</span>';

    row.innerHTML = `
      <td>${patient?.name || 'Paciente removido'}</td>
      <td>${appointment.professional}</td>
      <td><span class="status ${appointment.status.toLowerCase()}">${appointment.status}</span></td>
      <td>${appointment.careType}</td>
      <td>${insuranceName}</td>
      <td>${formatDateTime(appointment.datetime)}</td>
      <td class="actions">${actions}</td>
    `;

    elements.appointmentTable.appendChild(row);
  });

  elements.appointmentTable.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'concluir') {
        setAppointmentStatus(button.dataset.id, 'Concluído');
      }

      if (button.dataset.action === 'cancelar') {
        setAppointmentStatus(button.dataset.id, 'Cancelado');
      }
    });
  });
}

function formatDateTime(raw) {
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString('pt-BR');
}

init();
