import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../features/auth/api/authApi';
import type { Rol, UserPublic } from '../features/auth/types/auth';
import { queryClient } from '../shared/api/queryClient';
import { useCartStore } from './cartStore';

/** Datos del usuario que necesita la interfaz. NUNCA el token: viaja en la cookie HttpOnly. */
export interface UsuarioSesion {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: Rol;
}

interface AuthState {
  /** Usuario autenticado (null = sin sesión). */
  usuario: UsuarioSesion | null;
  /** true mientras checkSession confirma la sesión con /auth/me al abrir la app. */
  cargando: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  /** Limpia la sesión local sin llamar al backend (la usa el interceptor ante un 401). */
  limpiarSesion: () => void;
}

const aUsuarioSesion = ({ id, username, full_name, email, role }: UserPublic): UsuarioSesion => ({
  id,
  username,
  full_name,
  email,
  role,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await authApi.login({ username, password }); // el navegador guarda la cookie
        const perfil = await authApi.obtenerPerfil(); // con la cookie, se piden los datos
        queryClient.clear();
        set({ usuario: aUsuarioSesion(perfil), cargando: false });
      },

      logout: async () => {
        try {
          await authApi.logout(); // Set-Cookie que borra la cookie
        } finally {
          queryClient.clear();
          useCartStore.getState().vaciar(); // el próximo usuario no hereda el carrito
          set({ usuario: null, cargando: false });
        }
      },

      checkSession: async () => {
        set({ cargando: true });
        try {
          const perfil = await authApi.obtenerPerfil();
          set({ usuario: aUsuarioSesion(perfil) });
        } catch {
          // Sin cookie, vencida o cuenta desactivada: no hay sesión
          set({ usuario: null });
        } finally {
          set({ cargando: false });
        }
      },

      limpiarSesion: () => {
        queryClient.clear();
        set({ usuario: null, cargando: false });
      },
    }),
    {
      name: 'food-store-auth',
      // Se persiste SOLO el usuario: ni el token (no lo tenemos) ni el estado de carga
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
);

/** Selector de conveniencia para la interfaz condicional por rol. */
export const useEsAdmin = (): boolean => useAuthStore((s) => s.usuario?.role === 'admin');
