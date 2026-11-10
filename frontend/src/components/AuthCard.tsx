import type { ReactNode } from 'react';

interface AuthCardProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  pie?: ReactNode;
}

/** Tarjeta centrada para las páginas de login y registro. */
export default function AuthCard({ titulo, subtitulo, children, pie }: AuthCardProps) {
  return (
    <div className="mx-auto mt-4 w-full max-w-md sm:mt-10">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-stone-800">{titulo}</h1>
        <p className="mt-1 mb-6 text-sm text-stone-500">{subtitulo}</p>
        {children}
      </div>
      {pie && <div className="mt-4 text-center text-sm text-stone-600">{pie}</div>}
    </div>
  );
}
