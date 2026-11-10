import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import AuthCard from '../components/AuthCard';
import ErrorAlert from '../components/ui/ErrorAlert';
import FormField, { inputClass } from '../components/ui/FormField';
import { registerRequest } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import type { RegisterData, RegisterFormValues, UsuarioPublico } from '../types/auth.types';
import {
  combinar,
  emailValido,
  maxLargo,
  minLargo,
  requerido,
  usernameValido,
} from '../utils/validators';

const VALORES_INICIALES: RegisterFormValues = {
  username: '',
  full_name: '',
  email: '',
  password: '',
  confirmar: '',
};

type CampoTexto = Exclude<keyof RegisterFormValues, 'confirmar'>;

interface CampoConfig {
  name: CampoTexto;
  label: string;
  type: string;
  autoComplete: string;
  ayuda?: string;
  validar: (props: { value: string }) => string | undefined;
}

const CAMPOS: CampoConfig[] = [
  {
    name: 'username',
    label: 'Usuario',
    type: 'text',
    autoComplete: 'username',
    ayuda: 'Entre 3 y 50 caracteres, sin espacios',
    validar: combinar(
      requerido('El usuario es obligatorio'),
      minLargo(3),
      maxLargo(50),
      usernameValido,
    ),
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
    // RN-09: menos de 8 caracteres se rechaza
    validar: combinar(minLargo(8, 'La contraseña debe tener al menos 8 caracteres'), maxLargo(72)),
  },
];

export default function RegisterPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const registrar = useMutation<UsuarioPublico, Error, RegisterData>({
    mutationFn: registerRequest,
    // HU-01: al completar el registro se redirige al login
    onSuccess: (usuario) =>
      navigate('/login', { replace: true, state: { registrado: usuario.username } }),
  });

  const form = useForm({
    defaultValues: VALORES_INICIALES,
    onSubmit: async ({ value }) => {
      const datos: RegisterData = {
        username: value.username.trim(),
        full_name: value.full_name.trim(),
        email: value.email.trim(),
        password: value.password,
      };
      try {
        await registrar.mutateAsync(datos);
      } catch {
        /* el mensaje (409 usuario/email repetido, 422) se lee de registrar.error */
      }
    },
  });

  if (user) return <Navigate to="/categorias" replace />;

  return (
    <AuthCard
      titulo="Crear cuenta"
      subtitulo="Las cuentas nuevas tienen rol usuario: pueden ver el catálogo y hacer pedidos."
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
          <form.Field key={campo.name} name={campo.name} validators={{ onChange: campo.validar }}>
            {(field) => (
              <FormField
                id={field.name}
                label={campo.label}
                requerido
                ayuda={campo.ayuda}
                errores={field.state.meta.errors}
                mostrarErrores={field.state.meta.isTouched}
              >
                <input
                  id={field.name}
                  name={field.name}
                  type={campo.type}
                  autoComplete={campo.autoComplete}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                  className={inputClass}
                />
              </FormField>
            )}
          </form.Field>
        ))}

        <form.Field
          name="confirmar"
          validators={{
            // Se vuelve a validar cuando cambia la contraseña
            onChangeListenTo: ['password'],
            onChange: ({ value, fieldApi }) =>
              value !== fieldApi.form.getFieldValue('password')
                ? 'Las contraseñas no coinciden'
                : undefined,
          }}
        >
          {(field) => (
            <FormField
              id={field.name}
              label="Repetir contraseña"
              requerido
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            >
              <input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <ErrorAlert mensaje={registrar.error?.message} />

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full rounded-md bg-orange-600 px-4 py-2.5 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}
