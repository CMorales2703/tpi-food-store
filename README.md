# Food Store — TPI Programación 4

Sistema de pedidos de comida. Los clientes recorren el catálogo, arman un carrito y confirman un pedido con dirección de entrega y forma de pago. El administrador gestiona categorías, productos, stock, pedidos y usuarios desde un panel.

- **Backend:** FastAPI + SQLModel sobre PostgreSQL, con arquitectura en capas y Unit of Work.
- **Frontend:** React + TypeScript (Vite, Tailwind), TanStack Query, Form y Table, Zustand y Axios.
- **Sesión:** JWT en una cookie HttpOnly y dos roles (`user` y `admin`).

**Autor:** Cristian Morales · Tecnicatura Universitaria en Programación a Distancia (UTN)

| | |
|---|---|
| **Repositorio** | https://github.com/CMorales2703/tpi-food-store |
| **Video de demostración** | _(link pendiente)_ |

---

## Requisitos

| Herramienta | Versión | Verificar con |
|---|---|---|
| Python | **3.11, 3.12 o 3.13** (SQLModel no funciona con 3.14) | `python3 --version` |
| PostgreSQL | 15 o superior | `psql --version` |
| Node.js | 20.19 o superior | `node --version` |
| pnpm | 9 o superior | `pnpm --version` |

> **macOS:** el `python3` que viene con las Command Line Tools de Apple es 3.9 y no sirve. Instalar uno compatible con `brew install python@3.12` y crear el entorno virtual con `python3.12`.
> pnpm viene con Node: se habilita con `corepack enable pnpm`.

---

## Instalación y ejecución

Se levantan dos proyectos en dos terminales: primero el backend y después el frontend.

### 1. Backend (puerto 8000)

```bash
cd backend

# Entorno virtual y dependencias (versiones fijadas en requirements.txt)
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Variables de entorno: copiar y completar DATABASE_URL (ver la tabla de abajo)
cp .env.example .env               # Windows: copy .env.example .env

# Base de datos
createdb foodstore_db              # o en psql: CREATE DATABASE foodstore_db;

# Datos iniciales: usuario admin, 5 categorías y 13 productos con stock.
# Es idempotente: se puede ejecutar más de una vez sin duplicar nada.
python -m app.db.seed

# Ejecutar
uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/v1
- Documentación: http://localhost:8000/docs (Swagger) y http://localhost:8000/redoc

Las tablas se crean solas al iniciar la aplicación o al correr el seed.

### 2. Frontend (puerto 5173)

```bash
cd frontend
cp .env.example .env               # VITE_API_URL=http://localhost:8000/api/v1
pnpm install
pnpm build                         # compila y verifica los tipos (TypeScript strict)
pnpm dev
```

Abrir **http://localhost:5173**. Tiene que ser `localhost`, no `127.0.0.1`: ver *Problemas frecuentes*.

### Usuario administrador (lo crea el seed)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | `admin` |

Los clientes (rol `user`) se crean desde la pantalla de registro.

---

## Variables de entorno

### `backend/.env`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://user:pass@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Firma del JWT, **mínimo 32 caracteres** | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS (con credenciales) | `http://localhost:5173` |

Opcionales, con valor por defecto: `COOKIE_SECURE` (`false`; `true` con HTTPS), `COOKIE_SAMESITE` (`lax`) y `SQL_ECHO` (`false`).

- **PostgreSQL instalado con Homebrew (macOS):** el usuario es el de la Mac y no tiene contraseña. Por ejemplo: `postgresql://TU_USUARIO@localhost:5432/foodstore_db`.
- **Prueba rápida sin PostgreSQL:** `DATABASE_URL=sqlite:///./foodstore.db`.
- Para generar una clave propia: `python -c "import secrets; print(secrets.token_hex(32))"`.

### `frontend/.env`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API, **con** el prefijo `/api/v1` | `http://localhost:8000/api/v1` |

---

## Funcionalidades

**Cliente** (rol `user`):
- **Catálogo:** paginado en el servidor, con búsqueda por nombre, filtro por categoría, skeleton mientras carga y estado vacío.
- **Carrito:** persiste al recargar la página.
- **Checkout:** dirección de entrega, forma de pago (efectivo o transferencia) y notas.
- **Mis pedidos:** detalle de cada pedido; se puede cancelar mientras esté pendiente.

**Administrador** (rol `admin`):
- **Resumen:** tarjetas con los indicadores del negocio.
- **Categorías y productos:** ABM con tabla (orden, búsqueda y paginación) y formularios con validación. En productos, además, cambio de stock y disponibilidad.
- **Pedidos:** filtro por estado y botones para avanzar o cancelar según la máquina de estados.
- **Usuarios:** activar y desactivar cuentas. El admin no puede desactivarse a sí mismo.

### Máquina de estados del pedido

```
PENDIENTE ──► EN_PREPARACION ──► ENTREGADO
    │               │
    └──► CANCELADO ◄┘          (ENTREGADO y CANCELADO son terminales)
```

El cliente solo puede cancelar sus propios pedidos y solo mientras están en `PENDIENTE`. El admin avanza o cancela desde cualquier estado no terminal. **Al cancelar, el stock se restituye** en la misma transacción.

---

## Arquitectura

### Backend: módulos por dominio y capas

```
backend/app/
├── main.py                  # FastAPI, CORS con credenciales, routers bajo /api/v1
├── core/                    # config, database, security, deps, unit_of_work, base_repository, exceptions
├── modules/
│   ├── auth/                # router · service · schemas
│   ├── usuarios/            # models · schemas · repository · unit_of_work · service · router
│   ├── categorias/          # ídem
│   ├── productos/           # ídem
│   └── pedidos/             # ídem: RN-01 a RN-06, máquina de estados, resumen
└── db/
    ├── models.py            # registra las 5 tablas
    └── seed.py              # python -m app.db.seed
```

Flujo **Router → Service → Unit of Work → Repository → Model**:
- El **Router** valida con los schemas, resuelve la sesión y el rol con `Depends` y traduce las excepciones de dominio a `HTTPException`.
- El **Service** aplica las reglas de negocio dentro de `with self.uow as uow:` y devuelve el schema de salida.
- El **commit** ocurre solo en `UnitOfWork.__exit__`: ni el Service ni el Router llaman a `session.commit()`. Si algo falla dentro del bloque, se hace rollback y no se persiste nada. Por ejemplo, un pedido con un producto sin stock no descuenta el stock de los demás.

**Decisiones de implementación:**
- `DetallePedido` copia `nombre_producto` y `precio_unitario`: si después cambia el producto, el pedido no cambia.
- Al descontar o restituir stock, cada producto se lee con `SELECT … FOR UPDATE`. Así, dos compras simultáneas del último producto no dejan el stock en negativo.
- Las bajas son lógicas (`activo` en categorías y productos, `disabled` en usuarios) y los pedidos no se borran. Un registro dado de baja responde 404.
- Desde SQLAlchemy 2.1, una URL `postgresql://` usa por defecto psycopg 3. `config.py` la convierte a `postgresql+psycopg2://` para usar `psycopg2-binary`, como pide el stack.

### Frontend: organización por features

```
frontend/src/
├── shared/          # api/ (axiosInstance, handleApiError, queryClient) · ui/ · components/ · layout/ · utils/
├── features/        # auth · categorias · productos · usuarios · pedidos
│                    #   cada una con pages/ · components/ · hooks/ · api/ · types/
├── store/           # authStore (sesión) y cartStore (carrito), con Zustand + persist
├── routes/          # AppRouter y ProtectedRoute
├── App.tsx          # checkSession al montar + AppRouter
└── main.tsx         # QueryClientProvider
```

- **Estado del servidor:** lo maneja TanStack Query (catálogo, pedidos, usuarios, resumen), con `queryKey` descriptivas e invalidación después de cada mutación. Por ejemplo, al crear o cancelar un pedido se invalidan los pedidos y los productos, porque cambió el stock.
- **Estado del cliente:** lo maneja Zustand. En la sesión se persiste **solo el usuario**, nunca el token. El carrito se persiste completo.
- **`useEffect`:** el único de la aplicación es `checkSession`, al montar `App`.

### Sesión con cookie HttpOnly

1. El login (`POST /auth/token`, formulario OAuth2) responde `{"message": "Login exitoso"}` y una cookie HttpOnly `access_token`, que vence a los 30 minutos. El token nunca viaja en el cuerpo.
2. Axios usa `withCredentials: true`, así el navegador adjunta la cookie en cada petición. JavaScript no puede leerla.
3. En el backend, `get_current_user` valida la cookie (401), `get_current_active_user` rechaza las cuentas desactivadas (400) y `require_role(["admin"])` controla el rol (403).
4. Si una petición responde 401, o 400 con "Cuenta de usuario desactivada", el interceptor de Axios limpia el `authStore` y `ProtectedRoute` lleva al login.

Ocultar un botón en el frontend no protege nada: la protección real está en el backend, que valida cada petición.

---

## Probar la API sin el frontend

En `backend/` hay tres archivos `.http` para la extensión **REST Client** de VS Code. Recorren cada endpoint con los códigos de respuesta esperados. Se ejecutan en orden, con la base recién cargada:

```bash
dropdb foodstore_db && createdb foodstore_db && python -m app.db.seed
```

| Archivo | Qué prueba |
|---|---|
| `auth.http` | Registro (201, 409, 422), login (401, 200 con cookie), `/me`, logout y gestión de usuarios (403, 404, 400 al desactivarse a sí mismo, cuenta desactivada) |
| `catalogo.http` | Lecturas públicas, paginación, búsqueda y filtros; ABM de categorías y productos (201, 404, 409, 422); `PATCH /stock`; bajas lógicas (204 y después 404) |
| `pedidos.http` | RN-01 a RN-06: creación, rollback cuando un ítem falla, permisos por dueño y rol, máquina de estados, cancelación con restitución de stock y resumen |

---

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `TypeError: unsupported operand type(s) for \|` al iniciar el backend | El entorno virtual se creó con Python 3.9. Borrar `.venv` y crearlo con Python 3.11 a 3.13 |
| `Connection refused` en el puerto 5432 | PostgreSQL no está corriendo. Con Homebrew: `brew services start postgresql@16` |
| `role "postgres" does not exist` | Con Homebrew el usuario es el de la Mac: usar `createdb foodstore_db` sin `-U`, o crear el rol con `createuser -s postgres` |
| `No module named 'psycopg'` | La `DATABASE_URL` tiene `+psycopg`. Usar `postgresql://…`, sin indicar el driver |
| El backend no arranca y menciona `SECRET_KEY` | Falta el `.env`, o la clave tiene menos de 32 caracteres |
| "No se pudo conectar con el servidor" en el frontend | El backend no está corriendo, `VITE_API_URL` no termina en `/api/v1`, o el frontend no está en `http://localhost:5173` (CORS) |
| Vite levanta en el puerto 5174 | El 5173 está ocupado por otro proceso: `lsof -ti :5173 \| xargs kill` y `pnpm dev --strictPort` |
| El login responde bien pero la sesión no queda guardada | El frontend se abrió en `127.0.0.1`. Usar `localhost`, que es el origen que acepta el backend y el dominio de la cookie |
| No hay usuario admin | Ejecutar `python -m app.db.seed` |
