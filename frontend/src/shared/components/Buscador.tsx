interface BuscadorProps {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
}

/** Campo de búsqueda para filtrar una tabla del lado del cliente (globalFilter). */
export default function Buscador({ valor, onCambiar, placeholder = 'Buscar…' }: BuscadorProps) {
  return (
    <input
      type="search"
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full max-w-xs rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
    />
  );
}
