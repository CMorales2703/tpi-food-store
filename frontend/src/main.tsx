import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { queryClient } from './api/queryClient';
import { useAuthStore } from './store/authStore';

// HU-04: al iniciar la aplicación se confirma la sesión con GET /auth/me.
// Mientras tanto isLoading = true y ProtectedRoute muestra el indicador de carga.
void useAuthStore.getState().checkSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
