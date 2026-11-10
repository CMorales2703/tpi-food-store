import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { validarAlSalir } from '../../../shared/utils/form';
import MensajeError from '../../../shared/components/MensajeError';
import Button from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { requerido } from '../../../shared/utils/validators';
import { useAuthStore } from '../../../store/authStore';
import AuthCard from '../components/AuthCard';
import type { Credenciales } from '../types/auth';

/** Estado que pueden mandar otras páginas al redirigir al login. */
interface EstadoNavegacion {
  desde?: string;
  registrado?: string;
}

export default function LoginPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const estado = (useLocation().state ?? {}) as EstadoNavegacion;
  const [error, setError] = useState<unknown>(null);

  const form = useForm({
    defaultValues: { username: estado.registrado ?? '', password: '' } satisfies Credenciales,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await login(value.username.trim(), value.password);
        navigate(estado.desde ?? '/', { replace: true });
      } catch (err) {
        // 401 credenciales incorrectas / 400 cuenta desactivada
        setError(err);
      }
    },
  });

  // Con sesión activa no tiene sentido ver el login
  if (usuario) return <Navigate to={estado.desde ?? '/'} replace />;

  return (
    <AuthCard
      titulo="Iniciar sesión"
      subtitulo="Ingresá para confirmar tus pedidos y seguir su estado."
      pie={
        <>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-orange-700 hover:underline">
            Registrate
          </Link>
        </>
      }
    >
      {estado.registrado && !error && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Cuenta creada. Ya podés iniciar sesión.
        </p>
      )}
      {estado.desde && !estado.registrado && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Iniciá sesión para continuar.
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
        <form.Field
          name="username"
          validators={{ onChange: requerido('Ingresá tu usuario') }}
        >
          {(field) => (
            <Input
              id={field.name}
              label="Usuario"
              autoComplete="username"
              autoFocus={!estado.registrado}
              value={field.state.value}
              onBlur={validarAlSalir(field)}
              onChange={(e) => field.handleChange(e.target.value)}
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            />
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{ onChange: requerido('Ingresá tu contraseña') }}
        >
          {(field) => (
            <Input
              id={field.name}
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              autoFocus={Boolean(estado.registrado)}
              value={field.state.value}
              onBlur={validarAlSalir(field)}
              onChange={(e) => field.handleChange(e.target.value)}
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            />
          )}
        </form.Field>

        <MensajeError error={error} />

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              anchoCompleto
              disabled={!canSubmit}
              cargando={isSubmitting}
              textoCargando="Ingresando…"
            >
              Ingresar
            </Button>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}
