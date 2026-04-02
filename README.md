# Frontend - Sistema de Clínica

Interface web para operação de clínica com suporte a convênios, atendimentos e faturamento.

## Funcionalidades implementadas

- Cadastro de pacientes com CPF, responsável, convênio, carteirinha e opção de particular.
- Cadastro de convênios e tabela de procedimentos por convênio.
- Cadastro de atendimentos sempre iniciando com status `Agendado`.
- Botões na lista de atendimentos para concluir ou cancelar.
- Faturamento separado entre Particular e Convênios.
- Menu de navegação com Pacientes, Profissionais, Atendimentos, Convênios e Faturamento.

## Integração com backend existente

O frontend utiliza os endpoints abaixo (prefixo padrão `/api`):

- `GET/POST /pacientes`
- `GET/POST /convenios`
- `GET/POST /convenios/procedimentos`
- `GET/POST /atendimentos`
- `PATCH /atendimentos/:id/concluir`
- `PATCH /atendimentos/:id/cancelar`
- `GET /faturamento/resumo`

Para apontar para outra base, defina `window.API_BASE` antes de carregar `app.js`.

## Execução

Basta servir arquivos estáticos, por exemplo:

```bash
python3 -m http.server 8080
```
