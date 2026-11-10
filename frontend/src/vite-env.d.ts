/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API, con el prefijo /api/v1 (ver .env.example) */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
