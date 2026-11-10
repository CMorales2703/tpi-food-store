interface FormActionsProps {
  /** Valores de form.Subscribe: el botón se deshabilita si el form es inválido o se está enviando. */
  canSubmit: boolean;
  isSubmitting: boolean;
  textoGuardar: string;
  onCancelar: () => void;
}

/** Botones Cancelar / Guardar del pie de los formularios en modal. */
export default function FormActions({
  canSubmit,
  isSubmitting,
  textoGuardar,
  onCancelar,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancelar}
        className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Guardando…' : textoGuardar}
      </button>
    </div>
  );
}
