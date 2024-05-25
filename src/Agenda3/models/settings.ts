import { atom } from 'jotai'

export type Language = 'en' | 'zh-CN'
export type Settings = {
  isInitialized: boolean
  general?: {
    useJournalDayAsSchedule?: boolean
    language?: Language
    startOfWeek?: number
  }
  ics?: {
    repo?: string
    token?: string
  }
  viewOptions?: {
    hideCompleted?: boolean
    showFirstEventInCycleOnly?: boolean
    showTimeLog?: boolean
  }
  filters?: Filter[]
  selectedFilters?: string[]
  experimental?: {
    objective?: boolean
  }
}
export const DEFAULT_SETTINGS = {
  isInitialized: false,
  general: { language: 'en', startOfWeek: 1 },
  viewOptions: { showTimeLog: false },
} satisfies Settings
export const settingsAtom = atom<Settings>(DEFAULT_SETTINGS)

export type Filter = {
  id: string
  name: string
  query: string
  color: string
}
