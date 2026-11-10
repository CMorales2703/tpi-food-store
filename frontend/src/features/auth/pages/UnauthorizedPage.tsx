import { Link } from 'react-router-dom';
import Card from '../../../shared/ui/Card';
import { useAuthStore } from '../../../store/authStore';

/** Hay sesión, pero el rol no permite entrar a la página pedida. */
export default function UnauthorizedPage() {
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <p className="text-5xl" aria-hidden="true">
        🔒
      </p>
      <h1 className="mt-4 text-2xl font-bold text-stone-800">Sin permiso</h1>
      <p className="mt-2 text-stone-600">
        {usuario
          ? 'Tu cuenta no tiene permiso para ver esta página.'
          : 'Necesitás iniciar sesión para ver esta página.'}
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Volver al inicio
      </Link>
    </Card>
  );
}
