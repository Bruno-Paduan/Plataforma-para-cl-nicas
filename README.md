# Sistema de Gestão de Clínicas (Multi-tenant)

Projeto completo com **backend (Node + Express + SQLite)** e **frontend (React + Vite)**.

## Funcionalidades implementadas

- Login com perfis: `admin`, `secretaria`, `profissional`
- Cadastro de pacientes
- Cadastro de profissionais
- Cadastro de atendimentos
- Painel financeiro simples
- Multi-tenant por `clinica_id`
- Separação de dados por clínica
- Profissional visualiza apenas seus próprios dados

## Estrutura

- `backend/`: API REST e banco SQLite
- `frontend/`: interface web React

## Como rodar

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend em: `http://localhost:4000`

### 2) Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend em: `http://localhost:5173`

## Usuários de exemplo (senha `123456`)

- `admin@vida.com` (admin)
- `secretaria@vida.com` (secretaria)
- `joao@vida.com` (profissional)
- `admin@equilibrio.com` (admin de outra clínica)

## Regras de acesso

- Dados sempre filtrados por `clinica_id`
- Profissional:
  - só vê seu próprio cadastro de profissional
  - só vê atendimentos em que ele é o profissional
  - só vê pacientes atendidos por ele
  - vê financeiro apenas do próprio faturamento

## Observação

O arquivo `clinic.db` é criado automaticamente no backend na primeira execução, com dados iniciais para facilitar testes.
