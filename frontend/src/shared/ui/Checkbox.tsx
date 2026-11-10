interface CheckboxProps {
  id: string;
  label: string;
  descripcion?: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
}

export default function Checkbox({ id, label, descripcion, checked, onChange }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-orange-600"
      />
      <span>
        <span className="block text-sm font-medium text-stone-700">{label}</span>
        {descripcion && <span className="block text-xs text-stone-500">{descripcion}</span>}
      </span>
    </label>
  );
}
