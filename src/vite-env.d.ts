/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOC_WEBSOCKET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
