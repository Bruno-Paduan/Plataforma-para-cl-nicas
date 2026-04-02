# Plataforma para Clínicas

Implementação inicial de suporte a convênios em backend (Node.js/Express + SQLite) e frontend (React).

## Backend

Novas capacidades:

- Entidade `convenios` com rotas:
  - `GET /convenios`
  - `POST /convenios`
- Paciente com `convenio_id` e `numero_carteirinha`
- Atendimento com `tipo` (`PARTICULAR`/`CONVENIO`) e regras:
  - status inicial sempre `AGENDADO`
  - transição permitida apenas para `CONCLUIDO` ou `CANCELADO`
  - se `tipo = CONVENIO`, usa convênio do paciente automaticamente
- Endpoint de pré-faturamento:
  - `GET /atendimentos/faturamento` (somente `CONCLUIDO` + `CONVENIO`)

## Frontend

- Nova aba `Convênios`
- Formulário de convênio (`nome`, `codigo` opcional)
- Listagem de convênios
- Cadastro de paciente com:
  - select de convênio
  - campo número da carteirinha
- Cadastro de atendimento com tipo e controles de status
