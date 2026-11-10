from fastapi import APIRouter
from sqlalchemy import text
from sqlmodel import Session

from app.core.database import engine

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health() -> dict[str, str]:
    """Verifica que la API esté arriba y que la base de datos responda."""
    with Session(engine) as session:
        session.exec(text("SELECT 1"))  # type: ignore[call-overload]
    return {"status": "ok", "database": "ok"}
