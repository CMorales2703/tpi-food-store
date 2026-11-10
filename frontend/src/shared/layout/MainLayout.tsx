import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/** Estructura común: Navbar arriba y el contenido de la ruta debajo. */
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
