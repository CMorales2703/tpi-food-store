import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingState from './ui/LoadingState';
import { useAuthStore } from '../store/authStore';
import type { Rol } from '../types/auth.types';

interface ProtectedRouteProps {
  /** Roles permitidos. Si se omite, alcanza con tener sesión. */
  allowedRoles?: Rol[];
  /** Contenido a proteger. Si se omite, se renderizan las rutas hijas (<Outlet />). */
  children?: ReactNode;
}

/**
 * Protege rutas leyendo el AuthStore:
 * - mientras se confirma la sesión (/auth/me) → indicador de carga
 * - sin sesión → /login (recordando a qué página se quería entrar)
 * - con sesión pero rol no permitido → /unauthorized
 */
export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const location = useLocation();

  if (isLoading) return <LoadingState mensaje="Verificando sesión…" />;

  if (!user) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
