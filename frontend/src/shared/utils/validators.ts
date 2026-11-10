// Validadores para `validators` de form.Field (TanStack Form).
// Devuelven el mensaje de error o undefined si el valor es válido.
// Replican las reglas del backend para avisar antes de enviar.

export type Validador<T> = (props: { value: T }) => string | undefined;

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

/** Obligatorio: no vacío ni compuesto solo por espacios. */
export const requerido =
  (mensaje = 'Este campo es obligatorio'): Validador<string> =>
  ({ value }) =>
    value.trim().length === 0 ? mensaje : undefined;

export const minLargo =
  (min: number, mensaje?: string): Validador<string> =>
  ({ value }) =>
    value.trim().length < min ? (mensaje ?? `Mínimo ${min} caracteres`) : undefined;

export const maxLargo =
  (max: number): Validador<string> =>
  ({ value }) =>
    value.trim().length > max ? `Máximo ${max} caracteres` : undefined;

/** Usuario: letras, números, punto, guion o guion bajo (igual que el backend). */
export const usernameValido: Validador<string> = ({ value }) =>
  /^[A-Za-z0-9_.-]+$/.test(value.trim())
    ? undefined
    : 'Solo letras, números, punto, guion y guion bajo (sin espacios)';

export const emailValido: Validador<string> = ({ value }) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Ingresá un email válido';

/** Número >= 0 (precio). Acepta coma o punto decimal. */
export const numeroNoNegativo =
  (campo: string): Validador<string> =>
  ({ value }) => {
    if (value.trim() === '') return `El ${campo} es obligatorio`;
    const numero = Number(value.replace(',', '.'));
    if (Number.isNaN(numero)) return 'Ingresá un número válido';
    if (numero < 0) return `El ${campo} no puede ser negativo`;
    return undefined;
  };

/** Entero >= 0 (stock). */
export const enteroNoNegativo: Validador<string> = ({ value }) =>
  /^\d+$/.test(value.trim()) ? undefined : 'Ingresá un número entero mayor o igual a 0';

/** URL opcional: vacía o con http(s). */
export const urlOpcional: Validador<string> = ({ value }) =>
  value.trim() === '' || /^https?:\/\/\S+$/.test(value.trim())
    ? undefined
    : 'Ingresá una URL que empiece con http:// o https://';
