# Food Store — TPI Programación 4

Sistema de pedidos de comida: backend FastAPI + SQLModel (PostgreSQL) y frontend React + TypeScript.

Autor: Cristian Morales · Tecnicatura Universitaria en Programación a Distancia (UTN)

> README en construcción: se completa en la etapa de entrega.

## Requisitos

- **Python 3.11, 3.12 o 3.13.** SQLModel no funciona con 3.14, y Python 3.9 (el que trae macOS
  con las Command Line Tools) es demasiado viejo. Verificar con `python3 --version`.
- **PostgreSQL 15 o superior.** Para una prueba rápida se puede usar SQLite (ver Variables de entorno).

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # y completar DATABASE_URL
createdb foodstore_db              # crear la base en PostgreSQL
python -m app.db.seed              # carga admin, categorías y productos (idempotente)
uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/v1
- Documentación: http://localhost:8000/docs y http://localhost:8000/redoc

### Variables de entorno (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://user:pass@localhost:5432/foodstore_db` (prueba rápida: `sqlite:///./foodstore.db`) |
| `SECRET_KEY` | Firma del JWT, mínimo 32 caracteres | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS | `http://localhost:5173` |

### Usuario administrador (seed)

| Usuario | Contraseña |
|---|---|
| `admin` | `Admin1234!` |
