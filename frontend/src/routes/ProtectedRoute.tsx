import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Rol } from '../features/auth/types/auth';
import Cargando from '../shared/components/Cargando';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  /** Roles permitidos. Si se omite, alcanza con tener sesión. */
  roles?: Rol[];
  /** Contenido a proteger. Si se omite, se renderizan las rutas hijas (<Outlet />). */
  children?: ReactNode;
}

/**
 * - mientras checkSession confirma la sesión → indicador de carga
 * - sin sesión → /login (recordando la página pedida)
 * - con sesión pero sin el rol → /unauthorized
 * Ocultar un botón no protege nada: la protección real está en el backend (require_role).
 */
export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const cargando = useAuthStore((s) => s.cargando);
  const location = useLocation();

  if (cargando) return <Cargando mensaje="Verificando sesión…" />;

  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;

  if (roles && !roles.includes(usuario.role)) return <Navigate to="/unauthorized" replace />;

  return children ? <>{children}</> : <Outlet />;
}
