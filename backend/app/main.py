from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_all_tables()
    yield


app = FastAPI(
    title="Food Store API — TPI Programación 4",
    description=(
        "Sistema de pedidos de comida: catálogo, carrito, pedidos con máquina de estados y "
        "panel de administración. Sesión con JWT en cookie HttpOnly y roles (user / admin). "
        "Para probar desde Swagger: ejecutar POST /api/v1/auth/token y luego el resto de los "
        "endpoints (el navegador envía la cookie solo)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS con credenciales: el navegador sólo acepta y envía la cookie si el origen
# está listado explícitamente y allow_credentials=True (con "*" no funciona).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],  # por defecto http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Todas las rutas de la API bajo /api/v1.
for router in (
    auth_router,
    usuarios_router,
    categorias_router,
    productos_router,
    pedidos_router,
):
    app.include_router(router, prefix=settings.API_PREFIX)
