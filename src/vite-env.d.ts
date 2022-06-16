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
