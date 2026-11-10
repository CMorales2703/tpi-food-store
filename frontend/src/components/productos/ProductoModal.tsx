import Modal from '../Modal';
import ChipSelector from '../ui/ChipSelector';
import ErrorAlert from '../ui/ErrorAlert';
import FormActions from '../ui/FormActions';
import FormField, { inputClass } from '../ui/FormField';
import type { Categoria } from '../../types/categoria';
import type { Ingrediente } from '../../types/ingrediente';
import type { FormApiDe, ModoModal } from '../../types/form';
import type { ProductoFormValues } from '../../types/producto';
import {
  alMenosUno,
  combinar,
  maxLargo,
  precioValido,
  requerido,
  urlOpcional,
} from '../../utils/validators';

interface ProductoModalProps {
  isOpen: boolean;
  modo: ModoModal;
  /** Formulario creado con useForm (TanStack Form) en ProductsPage. */
  form: FormApiDe<ProductoFormValues>;
  /** Categorías disponibles para asociar al producto. */
  categorias: Categoria[];
  /** Ingredientes disponibles para asociar al producto. */
  ingredientes: Ingrediente[];
  errorApi: string | null;
  onClose: () => void;
}

export default function ProductoModal({
  isOpen,
  modo,
  form,
  categorias,
  ingredientes,
  errorApi,
  onClose,
}: ProductoModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modo === 'edicion' ? 'Editar producto' : 'Nuevo producto'}
      ancho="lg"
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
            // RN-06: nombre obligatorio
            onChange: combinar(requerido('El nombre es obligatorio'), maxLargo(150)),
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
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                aria-describedby={`${field.name}-error`}
                autoFocus
                maxLength={150}
                placeholder="Ej: Pizza Muzzarella"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="descripcion" validators={{ onChange: maxLargo(1000) }}>
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
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={2}
                maxLength={1000}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* RN-07: precio_base >= 0 */}
          <form.Field name="precio_base" validators={{ onChange: precioValido }}>
            {(field) => (
              <FormField
                id={field.name}
                label="Precio base ($)"
                requerido
                errores={field.state.meta.errors}
                mostrarErrores={field.state.meta.isTouched}
              >
                <input
                  id={field.name}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                  aria-describedby={`${field.name}-error`}
                  placeholder="0.00"
                  className={inputClass}
                />
              </FormField>
            )}
          </form.Field>

          {/* RN-08: disponible, default true */}
          <form.Field name="disponible">
            {(field) => (
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="h-4 w-4 accent-orange-600"
                  />
                  Disponible para la venta
                </label>
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="imagen_url" validators={{ onChange: urlOpcional }}>
          {(field) => (
            <FormField
              id={field.name}
              label="URL de imagen"
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
              ayuda="Opcional"
            >
              <input
                id={field.name}
                type="url"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                placeholder="https://…"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        {/* Multiplicidad 1..*: al menos una categoría; la primera marcada es la principal */}
        <form.Field
          name="categoria_ids"
          validators={{ onChange: alMenosUno('Elegí al menos una categoría') }}
        >
          {(field) => (
            <FormField
              id="categorias"
              label="Categorías"
              requerido
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
              ayuda="La primera que marcás queda como categoría principal"
            >
              <ChipSelector
                id="categorias"
                opciones={categorias}
                seleccion={field.state.value}
                onCambio={(ids) => {
                  field.handleChange(ids);
                  field.handleBlur();
                }}
                destacarPrimera
                mensajeVacio="No hay categorías. Creá una en la página Categorías."
              />
            </FormField>
          )}
        </form.Field>

        {/* Relación ProductoIngrediente: 0..* ingredientes */}
        <form.Field name="ingrediente_ids">
          {(field) => (
            <FormField id="ingredientes" label="Ingredientes" ayuda="Opcional">
              <ChipSelector
                id="ingredientes"
                opciones={ingredientes}
                seleccion={field.state.value}
                onCambio={(ids) => field.handleChange(ids)}
                mensajeVacio="No hay ingredientes cargados."
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
              textoGuardar={modo === 'edicion' ? 'Guardar cambios' : 'Crear producto'}
              onCancelar={onClose}
            />
          )}
        </form.Subscribe>
      </form>
    </Modal>
  );
}
