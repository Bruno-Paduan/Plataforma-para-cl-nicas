from datetime import datetime
from decimal import Decimal
import unittest

from app.atendimentos import (
    AtendimentoRepository,
    AtendimentoService,
    Paciente,
    PacienteRepository,
    Profissional,
    ProfissionalRepository,
    RegraNegocioError,
    StatusAtendimento,
    TipoAtendimento,
    UsuarioContexto,
)


class AtendimentoServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.pacientes = PacienteRepository()
        self.profissionais = ProfissionalRepository()
        self.atendimentos = AtendimentoRepository()
        self.service = AtendimentoService(self.pacientes, self.profissionais, self.atendimentos)

        self.pacientes.add(Paciente(id=1, nome="Ana", clinica_id=10))
        self.pacientes.add(Paciente(id=2, nome="Beto", clinica_id=20))

        self.profissionais.add(Profissional(id=100, nome="Dra. Lúcia", clinica_id=10))
        self.profissionais.add(Profissional(id=200, nome="Dr. Paulo", clinica_id=10))

    def test_criar_atendimento_valido(self) -> None:
        atendimento = self.service.criar_atendimento(
            paciente_id=1,
            profissional_id=100,
            data=datetime(2026, 3, 30, 10, 0),
            status=StatusAtendimento.REALIZADO,
            tipo=TipoAtendimento.PARTICULAR,
            valor=Decimal("250.00"),
            clinica_id=10,
        )

        self.assertEqual(atendimento.id, 1)
        self.assertEqual(atendimento.clinica_id, 10)

    def test_criar_atendimento_rejeita_paciente_invalido(self) -> None:
        with self.assertRaises(RegraNegocioError):
            self.service.criar_atendimento(
                paciente_id=999,
                profissional_id=100,
                data=datetime(2026, 3, 30, 10, 0),
                status=StatusAtendimento.FALTA,
                tipo=TipoAtendimento.CONVENIO,
                valor=Decimal("80.00"),
                clinica_id=10,
            )

    def test_filtra_por_clinica(self) -> None:
        self.service.criar_atendimento(
            paciente_id=1,
            profissional_id=100,
            data=datetime(2026, 3, 30, 9, 0),
            status=StatusAtendimento.REALIZADO,
            tipo=TipoAtendimento.PARTICULAR,
            valor=Decimal("100.00"),
            clinica_id=10,
        )
        self.pacientes.add(Paciente(id=3, nome="Carla", clinica_id=20))
        self.profissionais.add(Profissional(id=300, nome="Dr. José", clinica_id=20))
        self.service.criar_atendimento(
            paciente_id=3,
            profissional_id=300,
            data=datetime(2026, 3, 30, 11, 0),
            status=StatusAtendimento.FALTA,
            tipo=TipoAtendimento.CONVENIO,
            valor=Decimal("0.00"),
            clinica_id=20,
        )

        lista = self.service.listar_atendimentos(10, UsuarioContexto(papel="admin"))
        self.assertEqual(len(lista), 1)
        self.assertEqual(lista[0].clinica_id, 10)

    def test_profissional_so_ve_os_proprios(self) -> None:
        self.service.criar_atendimento(
            paciente_id=1,
            profissional_id=100,
            data=datetime(2026, 3, 30, 9, 0),
            status=StatusAtendimento.REALIZADO,
            tipo=TipoAtendimento.PARTICULAR,
            valor=Decimal("100.00"),
            clinica_id=10,
        )
        self.service.criar_atendimento(
            paciente_id=1,
            profissional_id=200,
            data=datetime(2026, 3, 30, 14, 0),
            status=StatusAtendimento.FALTA,
            tipo=TipoAtendimento.CONVENIO,
            valor=Decimal("120.00"),
            clinica_id=10,
        )

        lista_prof_100 = self.service.listar_atendimentos(
            10,
            UsuarioContexto(papel="profissional", profissional_id=100),
        )

        self.assertEqual(len(lista_prof_100), 1)
        self.assertEqual(lista_prof_100[0].profissional_id, 100)


if __name__ == "__main__":
    unittest.main()
