"""Repositorio base con el CRUD genérico.

El repositorio encapsula el acceso a la base de datos de UNA entidad.
Nunca llama a commit(): confirmar o revertir es responsabilidad del Unit of Work.
"""

from typing import Any, Generic, TypeVar

from sqlmodel import Session, SQLModel, select

from app.core.database import ahora

ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: Session) -> None:
        self.session = session

    # ---------- lectura ----------
    def get_by_id(self, id_: Any) -> ModelT | None:
        """Devuelve la fila por PK, ignorando las que tienen borrado lógico."""
        obj = self.session.get(self.model, id_)
        if obj is None or getattr(obj, "deleted_at", None) is not None:
            return None
        return obj

    def list_all(self, order_by: Any = None) -> list[ModelT]:
        stmt = select(self.model)
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        return list(self.session.exec(stmt).all())

    # ---------- escritura (sin commit) ----------
    def create(self, obj: ModelT) -> ModelT:
        """Agrega el objeto y hace flush: el id autoincremental queda disponible."""
        self.session.add(obj)
        self.session.flush()
        return obj

    def update(self, obj: ModelT, cambios: dict[str, Any]) -> ModelT:
        for campo, valor in cambios.items():
            setattr(obj, campo, valor)
        if hasattr(obj, "updated_at"):
            setattr(obj, "updated_at", ahora())
        self.session.add(obj)
        self.session.flush()
        return obj

    def soft_delete(self, obj: ModelT) -> None:
        setattr(obj, "deleted_at", ahora())
        self.session.add(obj)
        self.session.flush()

    def delete(self, obj: ModelT) -> None:
        self.session.delete(obj)
        self.session.flush()
