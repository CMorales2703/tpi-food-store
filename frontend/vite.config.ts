import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Alias @/ → src/ (el mismo alias se declara en tsconfig.app.json → paths)
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
