import { useForm } from '@tanstack/react-form';
import { validarAlSalir } from '../../../shared/utils/form';
import MensajeError from '../../../shared/components/MensajeError';
import Button from '../../../shared/ui/Button';
import Checkbox from '../../../shared/ui/Checkbox';
import { Input, Select, TextArea } from '../../../shared/ui/Input';
import {
  combinar,
  enteroNoNegativo,
  maxLargo,
  minLargo,
  numeroNoNegativo,
  requerido,
  urlOpcional,
} from '../../../shared/utils/validators';
import type { Categoria } from '../../categorias/types/categoria';
import type { Producto, ProductoCreate } from '../types/producto';

/** Valores del formulario: los números se editan como texto y se convierten al enviar. */
interface ValoresProducto {
  nombre: string;
  descripcion: string;
  precio_base: string;
  imagen_url: string;
  stock: string;
  disponible: boolean;
  categoria_id: string;
}

const validarNombre = combinar(requerido('El nombre es obligatorio'), minLargo(2), maxLargo(150));
const validarPrecio = numeroNoNegativo('precio');
const validarCategoria = requerido('Elegí una categoría');

interface ProductoFormProps {
  producto?: Producto;
  categorias: Categoria[];
  onGuardar: (datos: ProductoCreate) => Promise<unknown>;
  onCancelar: () => void;
  error: unknown;
}

/** Alta y edición de producto (TanStack Form). */
export default function ProductoForm({
  producto,
  categorias,
  onGuardar,
  onCancelar,
  error,
}: ProductoFormProps) {
  const form = useForm({
    defaultValues: {
      nombre: producto?.nombre ?? '',
      descripcion: producto?.descripcion ?? '',
      precio_base: producto ? String(producto.precio_base) : '',
      imagen_url: producto?.imagen_url ?? '',
      stock: producto ? String(producto.stock) : '0',
      disponible: producto?.disponible ?? true,
      categoria_id: producto ? String(producto.categoria_id) : '',
    } satisfies ValoresProducto,
    onSubmit: async ({ value }) => {
      try {
        await onGuardar({
          nombre: value.nombre.trim(),
          descripcion: value.descripcion.trim() || null,
          precio_base: Number(value.precio_base.replace(',', '.')),
          imagen_url: value.imagen_url.trim() || null,
          stock: Number(value.stock),
          disponible: value.disponible,
          categoria_id: Number(value.categoria_id),
        });
      } catch {
        /* el error del backend (por ejemplo, 404 de categoría) se muestra con `error` */
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
            value={field.state.value}
            onBlur={validarAlSalir(field)}
            onChange={(e) => field.handleChange(e.target.value)}
            errores={field.state.meta.errors}
            mostrarErrores={field.state.meta.isTouched}
          />
        )}
      </form.Field>

      <form.Field name="descripcion" validators={{ onChange: maxLargo(500) }}>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field
          name="categoria_id"
          validators={{ onChange: validarCategoria }}
        >
          {(field) => (
            <Select
              id={field.name}
              label="Categoría"
              requerido
              value={field.state.value}
              onBlur={validarAlSalir(field)}
              onChange={(e) => field.handleChange(e.target.value)}
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            >
              <option value="">Elegí una…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          )}
        </form.Field>

        <form.Field name="precio_base" validators={{ onChange: validarPrecio }}>
          {(field) => (
            <Input
              id={field.name}
              label="Precio"
              requerido
              inputMode="decimal"
              placeholder="0.00"
              value={field.state.value}
              onBlur={validarAlSalir(field)}
              onChange={(e) => field.handleChange(e.target.value)}
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            />
          )}
        </form.Field>
      </div>

      <form.Field name="imagen_url" validators={{ onChange: urlOpcional }}>
        {(field) => (
          <Input
            id={field.name}
            label="URL de la imagen"
            type="url"
            placeholder="https://…"
            value={field.state.value}
            onBlur={validarAlSalir(field)}
            onChange={(e) => field.handleChange(e.target.value)}
            errores={field.state.meta.errors}
            mostrarErrores={field.state.meta.isTouched}
          />
        )}
      </form.Field>

      <div className="grid items-end gap-4 sm:grid-cols-2">
        <form.Field name="stock" validators={{ onChange: enteroNoNegativo }}>
          {(field) => (
            <Input
              id={field.name}
              label="Stock"
              requerido
              inputMode="numeric"
              value={field.state.value}
              onBlur={validarAlSalir(field)}
              onChange={(e) => field.handleChange(e.target.value)}
              errores={field.state.meta.errors}
              mostrarErrores={field.state.meta.isTouched}
            />
          )}
        </form.Field>

        <form.Field name="disponible">
          {(field) => (
            <div className="pb-2">
              <Checkbox
                id={field.name}
                label="Disponible para la venta"
                checked={field.state.value}
                onChange={field.handleChange}
              />
            </div>
          )}
        </form.Field>
      </div>

      <MensajeError error={error} />

      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} cargando={isSubmitting} textoCargando="Guardando…">
              {producto ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
