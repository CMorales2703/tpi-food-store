import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import AuthCard from '../components/AuthCard';
import ErrorAlert from '../components/ui/ErrorAlert';
import FormField, { inputClass } from '../components/ui/FormField';
import LoadingState from '../components/ui/LoadingState';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials } from '../types/auth.types';
import { requerido } from '../utils/validators';

/** Estado que pueden mandar otras páginas al redirigir al login. */
interface EstadoNavegacion {
  desde?: string;
  registrado?: string;
}

const VALORES_INICIALES: LoginCredentials = { username: '', password: '' };
const PAGINA_INICIAL = '/categorias';

export default function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const estado = (useLocation().state ?? {}) as EstadoNavegacion;
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { ...VALORES_INICIALES, username: estado.registrado ?? '' },
    onSubmit: async ({ value }) => {
      setErrorLogin(null);
      try {
        await login(value.username.trim(), value.password);
        navigate(estado.desde ?? PAGINA_INICIAL, { replace: true });
      } catch (err) {
        // 401 credenciales incorrectas / 400 cuenta desactivada: se muestra sin recargar
        setErrorLogin(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      }
    },
  });

  if (isLoading) return <LoadingState mensaje="Verificando sesión…" />;
  // Con sesión activa no tiene sentido ver el login
  if (user) return <Navigate to={PAGINA_INICIAL} replace />;

  return (
    <AuthCard
      titulo="Iniciar sesión"
      subtitulo="Ingresá con tu usuario para gestionar el catálogo."
      pie={
        <>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-orange-700 hover:underline">
            Registrate
          </Link>
        </>
      }
    >
      {estado.registrado && !errorLogin && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Cuenta creada. Ya podés iniciar sesión.
        </p>
      )}

      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="username" validators={{ onChange: requerido('Ingresá tu usuario') }}>
          {(field) => (
            <FormField
              id={field.name}
              label="Usuario"
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            >
              <input
                id={field.name}
                name={field.name}
                autoComplete="username"
                autoFocus={!estado.registrado}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="password" validators={{ onChange: requerido('Ingresá tu contraseña') }}>
          {(field) => (
            <FormField
              id={field.name}
              label="Contraseña"
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            >
              <input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="current-password"
                autoFocus={Boolean(estado.registrado)}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <ErrorAlert mensaje={errorLogin} />

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full rounded-md bg-orange-600 px-4 py-2.5 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}
