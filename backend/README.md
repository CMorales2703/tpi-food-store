# Backend — Food Store API · TP Unidad 9 (seguridad)

**Alumno:** Cristian Morales · **Materia:** Programación IV — TUP a Distancia (UTN)

API REST en **FastAPI + SQLModel + PostgreSQL** que extiende el TP8 (categorías, productos, ingredientes y pedidos) con un módulo de seguridad: **JWT en una cookie HttpOnly**, gestión de usuarios y **autorización por roles** (`user` / `admin`).

## Requisitos

| Herramienta | Versión |
|---|---|
| Python | 3.11 o superior |
| PostgreSQL | 14 o superior |

## Instalación

Todos los comandos se ejecutan desde la carpeta `backend`.

```powershell
# 1. Base de datos (pgAdmin o psql)
psql -U postgres -c "CREATE DATABASE food_store;"

# 2. Entorno virtual y dependencias
python -m venv .venv
.venv\Scripts\activate            # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt

# 3. Variables de entorno
copy .env.example .env            # y completar los marcadores (ver abajo)

# 4. Catálogos, usuario admin y datos de prueba
python seed.py

# 5. Ejecutar
uvicorn app.main:app --reload
```

- API: <http://localhost:8000/api/v1>
- Swagger: <http://localhost:8000/docs> (ejecutar primero `POST /api/v1/auth/token`: el navegador guarda la cookie y la envía en el resto de las pruebas)

> Si venís del TP8, usá una base nueva o borrá las tablas (`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`): el esquema cambió (usuarios, catálogo de estados, vínculos con borrado lógico).

### Variables del `.env`

El `.env` **no se entrega**; se incluye `.env.example` con marcadores.

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL, con la contraseña de la base |
| `SECRET_KEY` | Clave para firmar el JWT. Generarla con `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | `HS256` y 30 minutos por defecto |
| `COOKIE_SECURE`, `COOKIE_SAMESITE` | `false` / `lax` en localhost. Con HTTPS, `COOKIE_SECURE=true` |
| `CORS_ORIGINS` | Origen del frontend: `http://localhost:5173` |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_FULL_NAME`, `ADMIN_PASSWORD` | Datos del admin inicial que crea `seed.py` |

Si falta `DATABASE_URL` o `SECRET_KEY`, la aplicación no arranca y avisa cuál falta.

## Seguridad

### Autenticación — `/api/v1/auth`

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| `POST` | `/register` | Público | 201 `UserPublic` (siempre rol `user`) · 409 usuario o email repetido · 422 datos inválidos |
| `POST` | `/token` | Público (formulario OAuth2 `username` + `password`) | 200 + **`Set-Cookie: access_token=…; HttpOnly`** · 401 credenciales incorrectas · 400 cuenta desactivada |
| `POST` | `/logout` | Público | 200 + `Set-Cookie` que borra la cookie |
| `GET` | `/me` | Sesión válida | 200 `UserPublic` · 401 sin sesión o token vencido · 400 cuenta desactivada |

- La contraseña se guarda con **hash bcrypt** (RN-01) y nunca se devuelve.
- El JWT viaja **sólo en la cookie HttpOnly** (RN-03): el cuerpo del login trae los datos del usuario, no el token.
- `OAuth2PasswordBearerWithCookie` extiende `OAuth2PasswordBearer` para leer el token de la cookie (y, si no hay, del encabezado `Authorization`, útil en Swagger).

### Dependencias reutilizables (`app/core/dependencies.py`)

```
get_current_user          → valida firma y vencimiento del JWT y carga el usuario  → 401
get_current_active_user   → además rechaza cuentas desactivadas                    → 400 "Cuenta de usuario desactivada"
require_role(["admin"])   → además exige el rol                                    → 403
```

Se encadenan: `require_role` depende de `get_current_active_user`, que depende de `get_current_user`. **Defensa en profundidad:** aunque el frontend oculte los botones, el backend vuelve a validar cada petición.

### Autorización por recurso

| Recurso | Lectura (`GET`) | Escritura |
|---|---|---|
| Categorías, Productos (y sus categorías), Ingredientes | Cualquier usuario autenticado | Sólo `admin` (403 para `user`) |
| Pedidos | `user` ve **sólo sus** pedidos; `admin`, todos | **Crear:** `user` o `admin`. **Cambiar estado / eliminar:** sólo `admin` |
| Catálogo `EstadoPedido` | Cualquier usuario autenticado | No existe: **405** (se carga con `seed.py`) |
| Usuarios `/admin/usuarios` | Sólo `admin` | Activar / desactivar: sólo `admin` |

Un `user` que consulta un pedido ajeno recibe **404** (no se revela que existe).

### Administración de usuarios

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/admin/usuarios` | Lista todos los usuarios (activos y desactivados) |
| `POST` | `/admin/usuarios/{id}/activar` | `disabled = false` |
| `POST` | `/admin/usuarios/{id}/desactivar` | `disabled = true`. Un admin no puede desactivarse a sí mismo (409) |

El primer admin lo crea `seed.py` con los datos `ADMIN_*` del `.env`, porque el registro público siempre asigna el rol `user` (RN-08).

## Borrado lógico (RN-11)

Ningún `DELETE` borra filas de la base:

| Modelo | Cómo |
|---|---|
| Categoría, Producto, Ingrediente, Pedido | `deleted_at` (fecha del borrado; `NULL` = activo). Los listados lo excluyen |
| ProductoCategoria, ProductoIngrediente | `deleted_at`. Desasociar marca el vínculo; volver a asociarlo lo reactiva |
| Usuario | `disabled`, con los endpoints activar / desactivar |
| DetallePedido | No tiene `DELETE`: se conserva con su pedido |
| EstadoPedido | Catálogo de sólo lectura, sin escrituras |

La consigna sugiere un campo `activo: bool` como ejemplo; se mantuvo `deleted_at` del TP8 porque además guarda **cuándo** se dio de baja el registro.

## Archivos `.http` (REST Client)

Ejecutar los bloques **en orden**, después de `python seed.py`. REST Client guarda la cookie entre peticiones, igual que el navegador. Las variables `@adminUser` y `@adminPassword` deben coincidir con el `.env`.

| Archivo | Qué demuestra |
|---|---|
| `auth.http` | Registro (201, 409, 422), login (401 / 200 con cookie HttpOnly), `/me`, logout, admin de usuarios (403 para user), cuenta desactivada (400) |
| `catalogo.http` | 401 sin sesión, user lee (200) pero no escribe (403), catálogo de estados con 405, CRUD completo como admin con sus 404 / 409 / 422 |
| `pedidos.http` | User crea pedidos y sólo ve los suyos; 403 al cambiar estado o borrar; 422 y 404 con rollback; admin cambia estado (422 fuera del catálogo, 409 estado terminal) y borra |

## Estructura

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # .env (DATABASE_URL, SECRET_KEY, cookie, CORS)
│   │   ├── database.py
│   │   ├── dependencies.py    # get_current_user, get_current_active_user, require_role
│   │   ├── exceptions.py      # excepciones de dominio → HTTP (400/401/403/404/409/422)
│   │   ├── repository.py      # BaseRepository (flush, sin commit)
│   │   ├── security.py        # bcrypt + creación y validación del JWT
│   │   └── unit_of_work.py
│   ├── modules/
│   │   ├── auth/              # router: register, token, logout, me
│   │   ├── usuarios/          # models, schemas, repository, unit_of_work, service, router (admin)
│   │   ├── categorias/
│   │   ├── productos/         # Producto + ProductoCategoria + ProductoIngrediente
│   │   ├── ingredientes/
│   │   ├── estados_pedido/    # catálogo de sólo lectura
│   │   ├── pedidos/           # Pedido (con usuario_id) + DetallePedido
│   │   └── health/
│   └── main.py                # CORS con credenciales + routers bajo /api/v1
├── .env.example
├── auth.http · catalogo.http · pedidos.http
├── requirements.txt
└── seed.py
```

Los endpoints de autenticación están en `modules/auth/`. Reutilizan el servicio y el repositorio de `modules/usuarios/`, que tiene modelo, esquemas, repositorio, servicio y router (este último con los endpoints de admin).

## Cambios respecto del TP8

**Ajustes sugeridos en la corrección del TP8**
- **Relación Producto–Ingrediente:** nueva tabla de enlace `producto_ingrediente` (PK compuesta, borrado lógico). `ProductoCreate` y `ProductoUpdate` aceptan `ingrediente_ids` y `ProductoRead` devuelve `ingredientes`.
- **Rutas:** se verificaron contra la consigna del TP9, que pide el prefijo `/api/v1/auth`. Para que la API quede uniforme, **todas** las rutas pasaron a `/api/v1` (`/api/v1/categorias`, `/api/v1/pedidos`, …).

**Otros cambios**
- Las tablas de enlace pasaron de borrado físico a borrado lógico.
- Las categorías e ingredientes de cada producto se leen con dos consultas en total para todo el listado. Así se excluyen los vínculos borrados y la categoría principal sale primera.
- Pedido: se agregó `usuario_id` y `estado` pasó a ser una FK al catálogo `EstadoPedido`, como en el diagrama UML. Si el estado pedido no existe en el catálogo, se responde 422.
- Se ejecuta con `uvicorn app.main:app --reload`, como pide la consigna.

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `RuntimeError: Falta la variable de entorno SECRET_KEY` | Crear el `.env` a partir de `.env.example` |
| El login responde 200 pero el frontend no queda logueado | El frontend tiene que abrirse en `http://localhost:5173`, no en `127.0.0.1`. La cookie es de `localhost` y además el origen tiene que estar en `CORS_ORIGINS` |
| `409 Falta cargar el catálogo de estados` al crear un pedido | Ejecutar `python seed.py` |
| `seed.py` pide `ADMIN_PASSWORD` | Definirla en el `.env` (mínimo 8 caracteres) |
| `la autentificación password falló para el usuario "postgres"` | Revisar la contraseña dentro de `DATABASE_URL` |
