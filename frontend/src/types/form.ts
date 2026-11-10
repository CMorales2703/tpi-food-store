import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormExtendedApi,
} from '@tanstack/react-form';

type Sync<T> = FormValidateOrFn<T> | undefined;
type Async<T> = FormAsyncValidateOrFn<T> | undefined;

/**
 * Tipo de la instancia que devuelve `useForm` para unos valores `T`.
 * Permite que la página cree el formulario y lo pase por props al modal
 * con tipado estricto (los validadores se definen a nivel de campo).
 */
export type FormApiDe<T> = ReactFormExtendedApi<
  T,
  Sync<T>, // onMount
  Sync<T>, // onChange
  Async<T>, // onChangeAsync
  Sync<T>, // onBlur
  Async<T>, // onBlurAsync
  Sync<T>, // onSubmit
  Async<T>, // onSubmitAsync
  Sync<T>, // onDynamic
  Async<T>, // onDynamicAsync
  Async<T>, // onServer
  unknown // submitMeta
>;

/** Modo del modal: alta o edición */
export type ModoModal = 'alta' | 'edicion';
