import Modal from '../Modal';
import ErrorAlert from '../ui/ErrorAlert';
import FormActions from '../ui/FormActions';
import FormField, { inputClass } from '../ui/FormField';
import type { FormApiDe, ModoModal } from '../../types/form';
import type { IngredienteFormValues } from '../../types/ingrediente';
import { combinar, maxLargo, requerido } from '../../utils/validators';

interface IngredienteModalProps {
  isOpen: boolean;
  modo: ModoModal;
  /** Formulario creado con useForm (TanStack Form) en IngredientesPage. */
  form: FormApiDe<IngredienteFormValues>;
  errorApi: string | null;
  onClose: () => void;
}

export default function IngredienteModal({
  isOpen,
  modo,
  form,
  errorApi,
  onClose,
}: IngredienteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modo === 'edicion' ? 'Editar ingrediente' : 'Nuevo ingrediente'}
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
            // RN-10: nombre obligatorio
            onChange: combinar(
              requerido('El nombre del ingrediente es obligatorio'),
              maxLargo(100),
            ),
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
                placeholder="Ej: Muzzarella"
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
              textoGuardar={modo === 'edicion' ? 'Guardar cambios' : 'Crear ingrediente'}
              onCancelar={onClose}
            />
          )}
        </form.Subscribe>
      </form>
    </Modal>
  );
}
