/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API (por ejemplo: http://localhost:4000/api). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
