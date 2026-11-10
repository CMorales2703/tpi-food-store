import { useEffect } from 'react';
import AppRouter from './routes/AppRouter';
import { useAuthStore } from './store/authStore';

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  // Única llamada en un useEffect de toda la app: al montar se confirma la sesión
  // con GET /auth/me (la cookie puede haber vencido aunque el usuario esté persistido).
  // Los datos del servidor se obtienen siempre con TanStack Query.
  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  return <AppRouter />;
}
