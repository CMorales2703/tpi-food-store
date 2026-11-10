import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

const claseLink = ({ isActive }: { isActive: boolean }): string =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-orange-600 text-white' : 'text-stone-300 hover:bg-stone-700 hover:text-white'
  }`;

const claseLinkAdmin = ({ isActive }: { isActive: boolean }): string =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-white text-orange-700 shadow-sm' : 'text-orange-900 hover:bg-orange-100'
  }`;

const ETIQUETA_ROL = { admin: 'Administrador', user: 'Cliente' } as const;

const LINKS_ADMIN = [
  { to: '/admin/resumen', texto: 'Resumen' },
  { to: '/admin/pedidos', texto: 'Pedidos' },
  { to: '/admin/productos', texto: 'Productos' },
  { to: '/admin/categorias', texto: 'Categorías' },
  { to: '/admin/usuarios', texto: 'Usuarios' },
];

export default function Navbar() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const cantidadCarrito = useCartStore((s) => s.cantidadTotal());
  const navigate = useNavigate();
  const [saliendo, setSaliendo] = useState(false);

  const cerrarSesion = async (): Promise<void> => {
    setSaliendo(true);
    try {
      await logout(); // borra la cookie (backend) y limpia el authStore
    } finally {
      setSaliendo(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 shadow">
      <nav className="bg-stone-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-white">
            🍕 Food Store
          </Link>

          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <NavLink to="/" end className={claseLink}>
              Catálogo
            </NavLink>
            {usuario && (
              <NavLink to="/mis-pedidos" className={claseLink}>
                Mis pedidos
              </NavLink>
            )}
            <NavLink to="/carrito" className={claseLink} aria-label="Carrito">
              🛒 Carrito
              {cantidadCarrito > 0 && (
                <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {cantidadCarrito}
                </span>
              )}
            </NavLink>
          </div>

          {usuario ? (
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-white">{usuario.full_name}</p>
                <p className="text-xs text-stone-400">
                  @{usuario.username} ·{' '}
                  <span
                    className={
                      usuario.role === 'admin' ? 'font-semibold text-orange-400' : 'text-stone-300'
                    }
                  >
                    {ETIQUETA_ROL[usuario.role]}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => void cerrarSesion()}
                disabled={saliendo}
                className="rounded-md border border-stone-600 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-700 disabled:opacity-50"
              >
                {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login" className={claseLink}>
                Ingresar
              </NavLink>
              <Link
                to="/register"
                className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Panel de administración: solo se muestra al admin (la protección real es del backend) */}
      {usuario?.role === 'admin' && (
        <div className="border-b border-orange-200 bg-orange-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2">
            <span className="mr-2 text-xs font-semibold tracking-wide text-orange-800 uppercase">
              Panel
            </span>
            {LINKS_ADMIN.map((link) => (
              <NavLink key={link.to} to={link.to} className={claseLinkAdmin}>
                {link.texto}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
