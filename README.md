# Plataforma para Clínicas

Módulo de atendimentos com regras de negócio para:

- validação de paciente e profissional no cadastro;
- isolamento de dados por `clinica_id`;
- restrição de visualização para que profissional veja apenas seus próprios atendimentos.

## Executar testes

```bash
python -m unittest discover -s tests -p 'test_*.py'
```
