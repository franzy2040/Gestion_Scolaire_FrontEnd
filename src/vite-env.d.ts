/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // ajoute d'autres variables d'env si besoin
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}