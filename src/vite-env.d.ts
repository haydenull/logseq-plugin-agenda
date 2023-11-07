/// <reference types="vite/client" />

type IInterruption = import('./helper/pomodoro').IInterruption
type AppUserConfigs = import('@logseq/libs/dist/LSPlugin').AppUserConfigs
interface Window {
  faizNavigate: (e: unknown) => void
  logseqAppUserConfigs: AppUserConfigs
  currentApp: 'app' | 'pomodoro' | 'modal' | 'agenda3App'
  /** if Agenda3 is mounted */
  isMounted?: boolean
  currentPomodoro: {
    uuid?: string
    state?: {
      paused?: boolean
    }
  }
  unmountPomodoroApp: () => void
  interruptionMap: Map<number, IInterruption[]>
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
