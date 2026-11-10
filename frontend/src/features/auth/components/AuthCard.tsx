import type { ReactNode } from 'react';
import Card from '../../../shared/ui/Card';

interface AuthCardProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  pie?: ReactNode;
}

/** Tarjeta centrada de las páginas de login y registro. */
export default function AuthCard({ titulo, subtitulo, children, pie }: AuthCardProps) {
  return (
    <div className="mx-auto mt-4 w-full max-w-md sm:mt-10">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-stone-800">{titulo}</h1>
        <p className="mt-1 mb-6 text-sm text-stone-500">{subtitulo}</p>
        {children}
      </Card>
      {pie && <div className="mt-4 text-center text-sm text-stone-600">{pie}</div>}
    </div>
  );
}
