# Frontend — Food Store · TP Unidad 9 (estado global y autenticación)

**Alumno:** Cristian Morales · **Materia:** Programación IV — TUP a Distancia (UTN)

SPA en **React + TypeScript + Vite** que consume la API autenticada del backend. Las peticiones salen de una **instancia de Axios con interceptores**, la sesión vive en un **store de Zustand con `persist`** y las rutas están protegidas por sesión y por rol. Los CRUD de categorías, productos e ingredientes del TP8 se conservan: siguen usando TanStack Query, Form y Table.

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 20 o superior |
| Backend | corriendo en `http://localhost:8000` con `seed.py` ejecutado (ver README del backend) |

## Instalación y ejecución

```powershell
npm install
copy .env.example .env     # opcional: VITE_API_URL=http://localhost:8000
npm run dev                # abrir http://localhost:5173 (no 127.0.0.1: la cookie es de localhost)
```

Dependencias nuevas de esta unidad: `npm install axios zustand` (la consigna usa `pnpm add`; el proyecto usa npm desde el TP7).

**Usuarios para probar:** el admin es el que define el `.env` del backend (`ADMIN_USERNAME` / `ADMIN_PASSWORD`). Un usuario con rol `user` se crea desde `/register`.

## Rutas

| Ruta | Página | Acceso |
|---|---|---|
| `/login`, `/register`, `/unauthorized` | `LoginPage`, `RegisterPage`, `UnauthorizedPage` | Públicas |
| `/categorias`, `/productos`, `/ingredientes` | `CategoriasPage`, `ProductsPage`, `IngredientesPage` | Cualquier usuario autenticado |
| `/admin/users` | `AdminUsersPage` (Activar / Desactivar) | Sólo `admin` |
| `/` | Redirige a `/categorias` (o a `/login` si no hay sesión) | — |

> **Sobre los nombres en español:** la consigna del TP9 muestra `/categories`, `/products`, `/ingredients` y `CategoriesPage.tsx`, pero la del TP8 pedía conservar los nombres en español de la unidad anterior, y el TP9 no exige cambiarlos. Por eso las tres páginas del CRUD mantienen sus rutas y archivos en español. Además, **`/categories`, `/products` e `/ingredients` funcionan como alias** que redirigen a las rutas en español. Las páginas nuevas usan los nombres del PDF.

## Cómo funciona la sesión

```
LoginPage ──login()──► AuthStore ──POST /auth/token──► backend: Set-Cookie access_token (HttpOnly)
                           │──────GET /auth/me───────► { username, full_name, email, role }
                           ▼
                   user en el store (persist → sessionStorage, SIN token)
                           ▼
        Navbar · ProtectedRoute · botones por rol leen useAuthStore
```

### Instancia de Axios — `src/api/axiosInstance.ts`

- `baseURL: ${VITE_API_URL}/api/v1` y **`withCredentials: true`**, para que el navegador envíe la cookie en cada petición.
- **Interceptor de solicitud:** no toca el token. La cookie es HttpOnly: JavaScript no puede leerla y el navegador la adjunta solo.
- **Interceptor de respuesta:**
  - ante un **401** (salvo en `/auth/token` y `/auth/me`) llama a `clearSession()` del AuthStore, y `ProtectedRoute` lleva a `/login`;
  - hace lo mismo con el 400 "Cuenta de usuario desactivada", el caso en que un admin desactiva una cuenta con la sesión abierta;
  - convierte cualquier error en un `ApiError` con el mensaje `detail` del backend (cadena, o lista de errores de validación en el 422).
- Todas las peticiones (CRUD, auth y admin) usan esta instancia. Ningún archivo lee ni guarda el token.

### AuthStore — `src/store/authStore.ts`

| | |
|---|---|
| **Estado** | `user: UsuarioAuth \| null` (username, full_name, email, role) · `isLoading` |
| **`login(username, password)`** | `POST /auth/token` (formulario OAuth2) y después `GET /auth/me` |
| **`logout()`** | `POST /auth/logout` (borra la cookie) y limpia el store y la caché de TanStack Query |
| **`checkSession()`** | `GET /auth/me` al iniciar la app (`main.tsx`). Mientras tanto `isLoading = true` |
| **`clearSession()`** | La usa el interceptor ante un 401 |
| **`persist`** | `sessionStorage`, con `partialize` que guarda **sólo** `user` (ni el token ni `isLoading`) |

Al recargar, el usuario guardado se vuelve a confirmar con `/auth/me`. Si la cookie venció, el store se limpia y la app vuelve al login.

### ProtectedRoute — `src/components/ProtectedRoute.tsx`

Recibe `allowedRoles` opcional y se usa como ruta de layout (`<Outlet />`):
- mientras se confirma la sesión → indicador de carga;
- sin sesión → `<Navigate to="/login" replace />` (recuerda a qué página se quería entrar);
- con sesión pero rol no permitido → `/unauthorized`.

### Interfaz condicional por rol

- El **Navbar** muestra nombre, usuario y rol, el botón **Cerrar sesión** y el link **Usuarios** sólo para el admin.
- En las páginas del CRUD, el botón **Nuevo…** y la columna **Editar / Eliminar** se muestran sólo si el rol es `admin` (`columnVisibility` de TanStack Table). Ocultarlos no reemplaza al backend, que responde 403 a un `user`.

### Formularios de login y registro (TanStack Form)

- **Login:** si las credenciales son incorrectas, el mensaje del backend se muestra sin recargar la página.
- **Registro:** valida usuario (3–50 caracteres, sin espacios), email, contraseña de al menos 8 caracteres y que la confirmación coincida (`onChangeListenTo`). Si el usuario o el email ya existen, muestra el 409. Al completarse, redirige a `/login` con el usuario precargado.

## Estructura

```
src/
├── api/
│   ├── axiosInstance.ts   # instancia + interceptores + ApiError
│   ├── authApi.ts         # login, me, logout, register y usuariosApi (admin)
│   ├── crud.ts            # crearCrudApi() sobre axiosInstance
│   ├── queryClient.ts     # TanStack Query (no reintenta 401/403)
│   └── recursos.ts
├── components/
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   ├── AuthCard.tsx
│   ├── categorias/ · productos/ · ingredientes/
│   └── ui/                # DataTable, ChipSelector, estados de carga/vacío/error…
├── pages/
│   ├── LoginPage.tsx · RegisterPage.tsx · UnauthorizedPage.tsx · AdminUsersPage.tsx
│   └── CategoriasPage.tsx · ProductsPage.tsx · IngredientesPage.tsx
├── store/
│   └── authStore.ts
├── types/
│   ├── auth.types.ts      # Rol, UsuarioAuth, UsuarioPublico, LoginCredentials, RegisterData…
│   └── categoria.ts · producto.ts · ingrediente.ts · form.ts · table.ts
└── App.tsx                # sólo Navbar + rutas
```

## Cambios respecto del TP8

- **Ajuste sugerido en la corrección:** los productos ahora tienen **ingredientes**. Se eligen en el formulario del producto y se muestran en la tabla.
- `fetch` se reemplazó por la instancia de Axios (`client.ts` → `axiosInstance.ts`).
- `main.tsx` usa el `queryClient` compartido y confirma la sesión al iniciar.

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| Después del login vuelve a `/login` | Abrir el frontend en `http://localhost:5173` (no `127.0.0.1`) y verificar `CORS_ORIGINS` en el backend |
| "No se pudo conectar con el servidor" | Levantar el backend y revisar `VITE_API_URL` |
| No hay ningún usuario admin | Ejecutar `python seed.py` en el backend |
