import { useForm } from '@tanstack/react-form';
import { validarAlSalir } from '../../../shared/utils/form';
import MensajeError from '../../../shared/components/MensajeError';
import Button from '../../../shared/ui/Button';
import Checkbox from '../../../shared/ui/Checkbox';
import { Input } from '../../../shared/ui/Input';
import { enteroNoNegativo } from '../../../shared/utils/validators';
import type { Producto, ProductoStockUpdate } from '../types/producto';

interface StockFormProps {
  producto: Producto;
  onGuardar: (datos: ProductoStockUpdate) => Promise<unknown>;
  onCancelar: () => void;
  error: unknown;
}

/** Cambio rápido de stock y disponibilidad (PATCH /productos/{id}/stock). */
export default function StockForm({ producto, onGuardar, onCancelar, error }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: String(producto.stock), disponible: producto.disponible },
    onSubmit: async ({ value }) => {
      try {
        await onGuardar({ stock: Number(value.stock), disponible: value.disponible });
      } catch {
        /* se muestra con `error` */
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
      <form.Field name="stock" validators={{ onChange: enteroNoNegativo }}>
        {(field) => (
          <Input
            id={field.name}
            label="Stock"
            requerido
            autoFocus
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
          <Checkbox
            id={field.name}
            label="Disponible para la venta"
            descripcion="Si no está disponible, sigue en el catálogo pero no se puede pedir."
            checked={field.state.value}
            onChange={field.handleChange}
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
            <Button type="submit" disabled={!canSubmit} cargando={isSubmitting} textoCargando="Guardando…">
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
