import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/** Acceso denegado: hay sesión, pero el rol no permite entrar a la página pedida. */
export default function UnauthorizedPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <p className="text-5xl">🔒</p>
      <h1 className="mt-4 text-2xl font-bold text-stone-800">Acceso denegado</h1>
      <p className="mt-2 text-stone-600">
        {user
          ? `Tu rol (${user.role}) no tiene permiso para ver esta página.`
          : 'Necesitás iniciar sesión para ver esta página.'}
      </p>
      <Link
        to={user ? '/categorias' : '/login'}
        className="mt-6 inline-block rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        {user ? 'Volver al catálogo' : 'Ir al login'}
      </Link>
    </div>
  );
}
