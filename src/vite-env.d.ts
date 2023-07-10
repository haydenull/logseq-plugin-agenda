/// <reference types="vite/client" />

interface Window {
  faizNavigate: (e: any) => void
  logseqAppUserConfigs: any
  currentApp: 'app' | 'pomodoro' | 'modal'
  currentPomodoro: {
    uuid?: string
    state?: {
      paused?: boolean
    }
  }
  unmountPomodoroApp: () => void
  interruptionMap: Map<number, any>
}

interface ImportMetaEnv {
  readonly VITE_LOGSEQ_API_SERVER: string
  readonly VITE_LOGSEQ_API_TOKEN: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
