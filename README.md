# Cadastro de profissionais

API simples para cadastro de profissionais por clínica.

## Campos

- `nome`
- `especialidade`
- `percentual_repasse`
- `clinica_id`

## Regras aplicadas

- Cada profissional pertence a uma clínica (`clinica_id` obrigatório).
- Listagem sempre filtrada por `clinica_id`.

## Executar

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Endpoints

### Criar profissional

`POST /profissionais`

Payload:

```json
{
  "nome": "Dr. João",
  "especialidade": "Cardiologia",
  "percentual_repasse": 35,
  "clinica_id": 1
}
```

### Listar profissionais por clínica

`GET /profissionais?clinica_id=1`
