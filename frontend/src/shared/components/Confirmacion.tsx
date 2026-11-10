import type { ReactNode } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import MensajeError from './MensajeError';

interface ConfirmacionProps {
  abierto: boolean;
  titulo: string;
  children: ReactNode;
  textoConfirmar: string;
  /** Error de la mutation (por ejemplo, un 404 o un 400 del backend). */
  error?: unknown;
  procesando?: boolean;
  peligro?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

/** Diálogo de confirmación para acciones que no se deshacen (bajas, cancelaciones). */
export default function Confirmacion({
  abierto,
  titulo,
  children,
  textoConfirmar,
  error,
  procesando = false,
  peligro = true,
  onConfirmar,
  onCerrar,
}: ConfirmacionProps) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo}>
      <div className="space-y-4">
        <div className="text-stone-700">{children}</div>
        <MensajeError error={error} />
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={onCerrar}>
            Volver
          </Button>
          <Button
            variante={peligro ? 'peligro' : 'primario'}
            cargando={procesando}
            textoCargando="Procesando…"
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
