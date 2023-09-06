/// <reference types="vite/client" />

type IInterruption = import('./helper/pomodoro').IInterruption
type AppUserConfigs = import('@logseq/libs/dist/LSPlugin').AppUserConfigs
interface Window {
  faizNavigate: (e: unknown) => void
  logseqAppUserConfigs: AppUserConfigs
  currentApp: 'app' | 'pomodoro' | 'modal'
  currentPomodoro: {
    uuid?: string
    state?: {
      paused?: boolean
    }
  }
  unmountPomodoroApp: () => void
  interruptionMap: Map<number, IInterruption[]>
  mockSettings: Record<string, unknown>
  __APP_VERSION__: string
}

interface ImportMetaEnv {
  readonly VITE_LOGSEQ_API_SERVER: string
  readonly VITE_LOGSEQ_API_TOKEN: string
  readonly VITE_MODE: 'development' | 'production' | 'web'
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
