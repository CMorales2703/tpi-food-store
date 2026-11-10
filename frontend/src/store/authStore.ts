import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { loginRequest, logoutRequest, meRequest } from '../api/authApi';
import { queryClient } from '../api/queryClient';
import type { UsuarioAuth, UsuarioPublico } from '../types/auth.types';

interface AuthState {
  /** Usuario autenticado (null = sin sesión). NO se guarda el token: viaja en la cookie HttpOnly. */
  user: UsuarioAuth | null;
  /** true mientras se confirma la sesión con /auth/me al iniciar la app. */
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  /** Limpia la sesión local sin llamar al backend (la usa el interceptor ante un 401). */
  clearSession: () => void;
}

/** Se queda sólo con los datos que necesita la interfaz. */
const aUsuarioAuth = ({ username, full_name, email, role }: UsuarioPublico): UsuarioAuth => ({
  username,
  full_name,
  email,
  role,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,

      login: async (username, password) => {
        await loginRequest({ username, password }); // el navegador guarda la cookie
        const usuario = await meRequest(); // con la cookie, se piden los datos
        queryClient.clear();
        set({ user: aUsuarioAuth(usuario), isLoading: false });
      },

      logout: async () => {
        try {
          await logoutRequest(); // Set-Cookie que borra la cookie
        } finally {
          queryClient.clear();
          set({ user: null, isLoading: false });
        }
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const usuario = await meRequest();
          set({ user: aUsuarioAuth(usuario) });
        } catch {
          // Sin cookie, vencida o cuenta desactivada: no hay sesión
          set({ user: null });
        } finally {
          set({ isLoading: false });
        }
      },

      clearSession: () => {
        queryClient.clear();
        set({ user: null, isLoading: false });
      },
    }),
    {
      name: 'food-store-auth',
      storage: createJSONStorage(() => sessionStorage),
      // RN-13: se persisten SOLO los datos del usuario (ni el token ni isLoading)
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

/** Selector de conveniencia para la interfaz condicional por rol. */
export const useEsAdmin = (): boolean => useAuthStore((s) => s.user?.role === 'admin');
