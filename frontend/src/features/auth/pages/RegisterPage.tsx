import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { validarAlSalir } from '../../../shared/utils/form';
import MensajeError from '../../../shared/components/MensajeError';
import Button from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import {
  combinar,
  emailValido,
  maxLargo,
  minLargo,
  requerido,
  usernameValido,
  type Validador,
} from '../../../shared/utils/validators';
import { useAuthStore } from '../../../store/authStore';
import { registrar } from '../api/authApi';
import AuthCard from '../components/AuthCard';
import type { UserCreate, UserPublic } from '../types/auth';

/** Valores del formulario: incluye la confirmación, que no se envía. */
interface ValoresRegistro extends UserCreate {
  confirmar: string;
}

const VALORES_INICIALES: ValoresRegistro = {
  username: '',
  full_name: '',
  email: '',
  password: '',
  confirmar: '',
};

interface CampoConfig {
  name: keyof UserCreate;
  label: string;
  type: string;
  autoComplete: string;
  ayuda?: string;
  validar: Validador<string>;
}

const CAMPOS: CampoConfig[] = [
  {
    name: 'username',
    label: 'Usuario',
    type: 'text',
    autoComplete: 'username',
    ayuda: 'Entre 3 y 50 caracteres, sin espacios',
    validar: combinar(requerido('El usuario es obligatorio'), minLargo(3), maxLargo(50), usernameValido),
  },
  {
    name: 'full_name',
    label: 'Nombre completo',
    type: 'text',
    autoComplete: 'name',
    validar: combinar(requerido('El nombre es obligatorio'), maxLargo(100)),
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    validar: combinar(requerido('El email es obligatorio'), emailValido),
  },
  {
    name: 'password',
    label: 'Contraseña',
    type: 'password',
    autoComplete: 'new-password',
    ayuda: 'Mínimo 8 caracteres',
    validar: combinar(minLargo(8, 'La contraseña debe tener al menos 8 caracteres'), maxLargo(72)),
  },
];

export default function RegisterPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const navigate = useNavigate();

  const registro = useMutation<UserPublic, Error, UserCreate>({
    mutationFn: registrar,
    // Registrado: al login, con el usuario ya completado
    onSuccess: (nuevo) => navigate('/login', { replace: true, state: { registrado: nuevo.username } }),
  });

  const form = useForm({
    defaultValues: VALORES_INICIALES,
    onSubmit: async ({ value }) => {
      try {
        await registro.mutateAsync({
          username: value.username.trim(),
          full_name: value.full_name.trim(),
          email: value.email.trim(),
          password: value.password,
        });
      } catch {
        /* el mensaje (409 usuario o email repetido) se muestra desde registro.error */
      }
    },
  });

  if (usuario) return <Navigate to="/" replace />;

  return (
    <AuthCard
      titulo="Crear cuenta"
      subtitulo="Registrate para hacer pedidos y seguir su estado."
      pie={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-orange-700 hover:underline">
            Iniciá sesión
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        {CAMPOS.map((campo) => (
          <form.Field
            key={campo.name}
            name={campo.name}
            validators={{ onChange: campo.validar }}
          >
            {(field) => (
              <Input
                id={field.name}
                label={campo.label}
                type={campo.type}
                requerido
                ayuda={campo.ayuda}
                autoComplete={campo.autoComplete}
                value={field.state.value}
                onBlur={validarAlSalir(field)}
                onChange={(e) => field.handleChange(e.target.value)}
                errores={field.state.meta.errors}
                mostrarErrores={field.state.meta.isTouched}
              />
            )}
          </form.Field>
        ))}

        <form.Field
          name="confirmar"
          validators={{
            // Se vuelve a validar cuando cambia la contraseña
            onChangeListenTo: ['password'],
            onChange: ({ value, fieldApi }) =>
              value === ''
                ? 'Repetí la contraseña'
                : value !== fieldApi.form.getFieldValue('password')
                  ? 'Las contraseñas no coinciden'
                  : undefined,
          }}
        >
          {(field) => (
            <Input
              id={field.name}
              label="Repetir contraseña"
              type="password"
              requerido
              autoComplete="new-password"
              value={field.state.value}
              onBlur={validarAlSalir(field)}
              onChange={(e) => field.handleChange(e.target.value)}
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            />
          )}
        </form.Field>

        <MensajeError error={registro.error} />

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              anchoCompleto
              disabled={!canSubmit}
              cargando={isSubmitting}
              textoCargando="Creando cuenta…"
            >
              Crear cuenta
            </Button>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}
