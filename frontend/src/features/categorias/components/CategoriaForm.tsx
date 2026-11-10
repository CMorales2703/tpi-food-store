import { useForm } from '@tanstack/react-form';
import { validarAlSalir } from '../../../shared/utils/form';
import MensajeError from '../../../shared/components/MensajeError';
import Button from '../../../shared/ui/Button';
import { Input, TextArea } from '../../../shared/ui/Input';
import { combinar, maxLargo, minLargo, requerido } from '../../../shared/utils/validators';
import type { Categoria, CategoriaCreate } from '../types/categoria';

const validarNombre = combinar(requerido('El nombre es obligatorio'), minLargo(2), maxLargo(100));

interface CategoriaFormProps {
  /** Categoría a editar; sin ella el formulario es de alta. */
  categoria?: Categoria;
  onGuardar: (datos: CategoriaCreate) => Promise<unknown>;
  onCancelar: () => void;
  error: unknown;
}

/** Alta y edición de categoría (TanStack Form). */
export default function CategoriaForm({ categoria, onGuardar, onCancelar, error }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: categoria?.nombre ?? '', descripcion: categoria?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      try {
        await onGuardar({
          nombre: value.nombre.trim(),
          descripcion: value.descripcion.trim() || null,
        });
      } catch {
        /* el 409 (nombre repetido) se muestra con la prop `error` */
      }
    },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="nombre" validators={{ onChange: validarNombre }}>
        {(field) => (
          <Input
            id={field.name}
            label="Nombre"
            requerido
            autoFocus
            ayuda="Entre 2 y 100 caracteres. No puede repetirse."
            value={field.state.value}
            onBlur={validarAlSalir(field)}
            onChange={(e) => field.handleChange(e.target.value)}
            errores={field.state.meta.errors}
            mostrarErrores={field.state.meta.isTouched}
          />
        )}
      </form.Field>

      <form.Field
        name="descripcion"
        validators={{ onChange: maxLargo(500) }}
      >
        {(field) => (
          <TextArea
            id={field.name}
            label="Descripción"
            value={field.state.value}
            onBlur={validarAlSalir(field)}
            onChange={(e) => field.handleChange(e.target.value)}
            errores={field.state.meta.errors}
            mostrarErrores={field.state.meta.isTouched}
          />
        )}
      </form.Field>

      <MensajeError error={error} />

      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              cargando={isSubmitting}
              textoCargando="Guardando…"
            >
              {categoria ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
