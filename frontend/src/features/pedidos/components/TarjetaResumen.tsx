import Card from '../../../shared/ui/Card';

interface TarjetaResumenProps {
  titulo: string;
  valor: string | number;
  icono: string;
  /** Clase de color del acento (borde izquierdo). */
  acento: string;
}

/** Tarjeta de un indicador del panel. */
export default function TarjetaResumen({ titulo, valor, icono, acento }: TarjetaResumenProps) {
  return (
    <Card className={`border-l-4 p-5 ${acento}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{titulo}</p>
          <p className="mt-1 text-3xl font-bold text-stone-900 tabular-nums">{valor}</p>
        </div>
        <span className="text-3xl" aria-hidden="true">
          {icono}
        </span>
      </div>
    </Card>
  );
}
