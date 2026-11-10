// Validadores para los `validators` de form.Field (TanStack Form).
// Devuelven el mensaje de error o undefined si el valor es válido.
// Replican las reglas del backend (RN-01, RN-06, RN-07, RN-10) para avisar antes de enviar.

type Validador<T> = (props: { value: T }) => string | undefined;

/** Obligatorio: no vacío ni compuesto sólo por espacios. */
export const requerido =
  (mensaje = 'Este campo es obligatorio'): Validador<string> =>
  ({ value }) =>
    value.trim().length === 0 ? mensaje : undefined;

/** Combina validadores: devuelve el primer error encontrado. */
export const combinar =
  <T>(...validadores: Validador<T>[]): Validador<T> =>
  (props) => {
    for (const validar of validadores) {
      const error = validar(props);
      if (error) return error;
    }
    return undefined;
  };

export const maxLargo =
  (max: number): Validador<string> =>
  ({ value }) =>
    value.trim().length > max ? `Máximo ${max} caracteres` : undefined;

/** Precio: número mayor o igual a 0 con hasta 2 decimales. */
export const precioValido: Validador<string> = ({ value }) => {
  if (value.trim() === '') return 'El precio es obligatorio';
  const numero = Number(value.replace(',', '.'));
  if (Number.isNaN(numero)) return 'Ingresá un número válido';
  if (numero < 0) return 'El precio no puede ser negativo';
  if (!/^\d+([.,]\d{1,2})?$/.test(value.trim())) return 'Usá como máximo 2 decimales';
  return undefined;
};

/** URL opcional: vacía o con http(s). */
export const urlOpcional: Validador<string> = ({ value }) =>
  value.trim() === '' || /^https?:\/\/\S+$/.test(value.trim())
    ? undefined
    : 'Ingresá una URL que empiece con http:// o https://';

/** Al menos un elemento seleccionado (multiplicidad 1..*). */
export const alMenosUno =
  (mensaje: string): Validador<number[]> =>
  ({ value }) =>
    value.length === 0 ? mensaje : undefined;

export const minLargo =
  (min: number, mensaje?: string): Validador<string> =>
  ({ value }) =>
    value.length < min ? (mensaje ?? `Mínimo ${min} caracteres`) : undefined;

/** Usuario: letras, números, punto, guion o guion bajo (igual que el backend). */
export const usernameValido: Validador<string> = ({ value }) =>
  /^[A-Za-z0-9_.-]+$/.test(value.trim())
    ? undefined
    : 'Sólo letras, números, punto, guion y guion bajo (sin espacios)';

/** Formato básico de email (el backend lo valida con EmailStr, RN-09). */
export const emailValido: Validador<string> = ({ value }) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Ingresá un email válido';
