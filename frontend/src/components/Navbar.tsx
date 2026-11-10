import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-orange-600 text-white' : 'text-stone-300 hover:bg-stone-700 hover:text-white'
  }`;

const ETIQUETA_ROL: Record<string, string> = { admin: 'Administrador', user: 'Usuario' };

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [saliendo, setSaliendo] = useState<boolean>(false);

  const cerrarSesion = async (): Promise<void> => {
    setSaliendo(true);
    try {
      await logout(); // borra la cookie (backend) y limpia el AuthStore
    } finally {
      setSaliendo(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav className="bg-stone-900 shadow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="text-lg font-bold text-white">🍕 Food Store</span>

        {user && (
          <>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <NavLink to="/categorias" className={linkClass}>
                Categorías
              </NavLink>
              <NavLink to="/productos" className={linkClass}>
                Productos
              </NavLink>
              <NavLink to="/ingredientes" className={linkClass}>
                Ingredientes
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin/users" className={linkClass}>
                  Usuarios
                </NavLink>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-white">{user.full_name}</p>
                <p className="text-xs text-stone-400">
                  @{user.username} ·{' '}
                  <span
                    className={
                      user.role === 'admin' ? 'font-semibold text-orange-400' : 'text-stone-300'
                    }
                  >
                    {ETIQUETA_ROL[user.role] ?? user.role}
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
          </>
        )}
      </div>
    </nav>
  );
}
