const formatoPrecio = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export const formatearPrecio = (valor: number): string => formatoPrecio.format(valor);
