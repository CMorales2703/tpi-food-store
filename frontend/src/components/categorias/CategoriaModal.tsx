import Modal from '../Modal';
import ErrorAlert from '../ui/ErrorAlert';
import FormActions from '../ui/FormActions';
import FormField, { inputClass } from '../ui/FormField';
import type { CategoriaFormValues } from '../../types/categoria';
import type { FormApiDe, ModoModal } from '../../types/form';
import { combinar, maxLargo, requerido } from '../../utils/validators';

interface CategoriaModalProps {
  isOpen: boolean;
  modo: ModoModal;
  /** Formulario creado con useForm (TanStack Form) en CategoriasPage. */
  form: FormApiDe<CategoriaFormValues>;
  /** Mensaje de error de la API (por ejemplo, 409 por nombre duplicado). */
  errorApi: string | null;
  onClose: () => void;
}

export default function CategoriaModal({
  isOpen,
  modo,
  form,
  errorApi,
  onClose,
}: CategoriaModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modo === 'edicion' ? 'Editar categoría' : 'Nueva categoría'}
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
        <form.Field
          name="nombre"
          validators={{
            onChange: combinar(requerido('El nombre es obligatorio'), maxLargo(100)),
          }}
        >
          {(field) => (
            <FormField
              id={field.name}
              label="Nombre"
              requerido
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            >
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                aria-describedby={`${field.name}-error`}
                autoFocus
                maxLength={100}
                placeholder="Ej: Pizzas"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="descripcion" validators={{ onChange: maxLargo(500) }}>
          {(field) => (
            <FormField
              id={field.name}
              label="Descripción"
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
              ayuda="Opcional"
            >
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={3}
                maxLength={500}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <ErrorAlert mensaje={errorApi} />

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <FormActions
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              textoGuardar={modo === 'edicion' ? 'Guardar cambios' : 'Crear categoría'}
              onCancelar={onClose}
            />
          )}
        </form.Subscribe>
      </form>
    </Modal>
  );
}
