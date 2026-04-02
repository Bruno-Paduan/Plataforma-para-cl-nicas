from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from enum import Enum


class StatusAtendimento(str, Enum):
    REALIZADO = "realizado"
    FALTA = "falta"


class TipoAtendimento(str, Enum):
    PARTICULAR = "particular"
    CONVENIO = "convênio"


@dataclass(frozen=True)
class Paciente:
    id: int
    nome: str
    clinica_id: int


@dataclass(frozen=True)
class Profissional:
    id: int
    nome: str
    clinica_id: int


@dataclass(frozen=True)
class Atendimento:
    id: int
    paciente_id: int
    profissional_id: int
    data: datetime
    status: StatusAtendimento
    tipo: TipoAtendimento
    valor: Decimal
    clinica_id: int


class RegraNegocioError(ValueError):
    pass


class PacienteRepository:
    def __init__(self) -> None:
        self._pacientes: dict[int, Paciente] = {}

    def add(self, paciente: Paciente) -> None:
        self._pacientes[paciente.id] = paciente

    def get(self, paciente_id: int) -> Paciente | None:
        return self._pacientes.get(paciente_id)


class ProfissionalRepository:
    def __init__(self) -> None:
        self._profissionais: dict[int, Profissional] = {}

    def add(self, profissional: Profissional) -> None:
        self._profissionais[profissional.id] = profissional

    def get(self, profissional_id: int) -> Profissional | None:
        return self._profissionais.get(profissional_id)


class AtendimentoRepository:
    def __init__(self) -> None:
        self._atendimentos: dict[int, Atendimento] = {}
        self._next_id = 1

    def add(self, atendimento: Atendimento) -> Atendimento:
        persisted = Atendimento(
            id=self._next_id,
            paciente_id=atendimento.paciente_id,
            profissional_id=atendimento.profissional_id,
            data=atendimento.data,
            status=atendimento.status,
            tipo=atendimento.tipo,
            valor=atendimento.valor,
            clinica_id=atendimento.clinica_id,
        )
        self._atendimentos[self._next_id] = persisted
        self._next_id += 1
        return persisted

    def list_by_clinica(self, clinica_id: int) -> list[Atendimento]:
        return [a for a in self._atendimentos.values() if a.clinica_id == clinica_id]


@dataclass(frozen=True)
class UsuarioContexto:
    papel: str
    profissional_id: int | None = None


class AtendimentoService:
    def __init__(
        self,
        pacientes: PacienteRepository,
        profissionais: ProfissionalRepository,
        atendimentos: AtendimentoRepository,
    ) -> None:
        self._pacientes = pacientes
        self._profissionais = profissionais
        self._atendimentos = atendimentos

    def criar_atendimento(
        self,
        paciente_id: int,
        profissional_id: int,
        data: datetime,
        status: StatusAtendimento,
        tipo: TipoAtendimento,
        valor: Decimal,
        clinica_id: int,
    ) -> Atendimento:
        paciente = self._pacientes.get(paciente_id)
        if paciente is None or paciente.clinica_id != clinica_id:
            raise RegraNegocioError("Paciente inválido para a clínica informada.")

        profissional = self._profissionais.get(profissional_id)
        if profissional is None or profissional.clinica_id != clinica_id:
            raise RegraNegocioError("Profissional inválido para a clínica informada.")

        novo = Atendimento(
            id=0,
            paciente_id=paciente_id,
            profissional_id=profissional_id,
            data=data,
            status=status,
            tipo=tipo,
            valor=valor,
            clinica_id=clinica_id,
        )
        return self._atendimentos.add(novo)

    def listar_atendimentos(self, clinica_id: int, usuario: UsuarioContexto) -> list[Atendimento]:
        atendimentos = self._atendimentos.list_by_clinica(clinica_id)

        if usuario.papel.lower() == "profissional":
            if usuario.profissional_id is None:
                raise RegraNegocioError("Profissional sem identificação para consulta de atendimentos.")
            return [a for a in atendimentos if a.profissional_id == usuario.profissional_id]

        return atendimentos
