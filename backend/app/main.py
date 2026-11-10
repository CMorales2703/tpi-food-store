from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.estados_pedido.router import router as estados_pedido_router
from app.modules.health.router import router as health_router
from app.modules.ingredientes.router import router as ingredientes_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Food Store API — TP Unidad 9",
    description=(
        "Catálogo, pedidos y seguridad: JWT en cookie HttpOnly, usuarios y roles (user / admin). "
        "Para probar desde Swagger: ejecutar POST /api/v1/auth/token y luego el resto de los "
        "endpoints (el navegador envía la cookie solo)."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

# CORS con credenciales: el navegador sólo acepta y envía la cookie si el origen
# está listado explícitamente y allow_credentials=True (con "*" no funciona).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # por defecto http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Todas las rutas de la API bajo /api/v1
for router in (
    health_router,
    auth_router,
    usuarios_router,
    categorias_router,
    productos_router,
    ingredientes_router,
    estados_pedido_router,
    pedidos_router,
):
    app.include_router(router, prefix=settings.API_PREFIX)
