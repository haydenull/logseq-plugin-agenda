/// <reference types="vite/client" />

type AppUserConfigs = import('@logseq/libs/dist/LSPlugin').AppUserConfigs
interface Window {
  logseqAppUserConfigs: AppUserConfigs
  currentApp: 'agenda3App'
  /** if Agenda3 is mounted */
  isMounted?: boolean
  mockSettings: Record<string, unknown>
}
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_LOGSEQ_API_SERVER: string
  readonly VITE_LOGSEQ_API_TOKEN: string
  readonly VITE_MODE: 'development' | 'production' | 'web' | 'plugin'
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
