import { useForm } from '@tanstack/react-form';
import MensajeError from '../../../shared/components/MensajeError';
import Button from '../../../shared/ui/Button';
import { Campo, Input, TextArea } from '../../../shared/ui/Input';
import { combinar, maxLargo, minLargo, requerido } from '../../../shared/utils/validators';
import { FORMAS_PAGO, type FormaPago } from '../types/pedido';

export interface DatosCheckout {
  direccion_entrega: string;
  forma_pago: FormaPago;
  notas: string;
}

const ETIQUETA_PAGO: Record<FormaPago, { titulo: string; detalle: string }> = {
  EFECTIVO: { titulo: '💵 Efectivo', detalle: 'Pagás al recibir el pedido' },
  TRANSFERENCIA: { titulo: '🏦 Transferencia', detalle: 'Te enviamos los datos al confirmar' },
};

// RN-06: dirección de 5 a 200 caracteres (igual que el backend)
const validarDireccion = combinar(
  requerido('Ingresá la dirección de entrega'),
  minLargo(5, 'La dirección debe tener al menos 5 caracteres'),
  maxLargo(200),
);

interface CheckoutFormProps {
  onConfirmar: (datos: DatosCheckout) => Promise<unknown>;
  error: unknown;
}

/** Formulario de entrega y pago (TanStack Form). */
export default function CheckoutForm({ onConfirmar, error }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO', notas: '' } as DatosCheckout,
    onSubmit: async ({ value }) => {
      try {
        await onConfirmar(value);
      } catch {
        /* el error del backend (stock insuficiente, etc.) se muestra con la prop `error` */
      }
    },
  });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="direccion_entrega"
        validators={{ onChange: validarDireccion, onBlur: validarDireccion }}
      >
        {(field) => (
          <Input
            id={field.name}
            label="Dirección de entrega"
            requerido
            placeholder="Calle, número, piso y depto."
            autoComplete="street-address"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            errores={field.state.meta.errors}
            mostrarErrores={field.state.meta.isTouched}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <Campo id="forma_pago" label="Forma de pago" requerido>
            <div id="forma_pago" role="radiogroup" className="grid gap-3 sm:grid-cols-2">
              {FORMAS_PAGO.map((forma) => {
                const elegida = field.state.value === forma;
                return (
                  <label
                    key={forma}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      elegida
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                        : 'border-stone-300 bg-white hover:border-orange-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={forma}
                      checked={elegida}
                      onChange={() => field.handleChange(forma)}
                      className="sr-only"
                    />
                    <span className="block font-medium text-stone-800">
                      {ETIQUETA_PAGO[forma].titulo}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {ETIQUETA_PAGO[forma].detalle}
                    </span>
                  </label>
                );
              })}
            </div>
          </Campo>
        )}
      </form.Field>

      <form.Field
        name="notas"
        validators={{ onChange: maxLargo(500), onBlur: maxLargo(500) }}
      >
        {(field) => (
          <TextArea
            id={field.name}
            label="Notas (opcional)"
            placeholder="Timbre, entre calles, sin cebolla…"
            value={field.state.value}
            onBlur={field.handleBlur}
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
            textoCargando="Confirmando pedido…"
          >
            Confirmar pedido
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
