/** Lo mínimo de un campo de TanStack Form que necesita `validarAlSalir`. */
interface CampoValidable {
  handleBlur: () => void;
  validate: (causa: 'change') => unknown;
}

/**
 * onBlur de los inputs: marca el campo como tocado y corre su validador onChange.
 * Así un campo que se deja vacío muestra el error al salir, y ese error se borra
 * apenas se escribe un valor válido (un validador onBlur aparte quedaría "pegado"
 * hasta volver a salir del campo y dejaría el botón de enviar deshabilitado).
 */
export const validarAlSalir = (campo: CampoValidable) => (): void => {
  campo.handleBlur();
  void campo.validate('change');
};
