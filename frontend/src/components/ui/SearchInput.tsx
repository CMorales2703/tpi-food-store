interface SearchInputProps {
  valor: string;
  onCambio: (valor: string) => void;
  placeholder?: string;
}

/** Buscador para el globalFilter de TanStack Table. */
export default function SearchInput({
  valor,
  onCambio,
  placeholder = 'Buscar…',
}: SearchInputProps) {
  return (
    <input
      type="search"
      value={valor}
      onChange={(e) => onCambio(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none sm:max-w-xs"
    />
  );
}
