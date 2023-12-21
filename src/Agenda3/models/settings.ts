import { atom } from 'jotai'

export type Language = 'en' | 'zh-CN'
export type Settings = {
  isInitialized: boolean
  general?: {
    useJournalDayAsSchedule?: boolean
    language?: Language
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
export const settingsAtom = atom<Settings>({ isInitialized: false, viewOptions: { showTimeLog: false } })

export type Filter = {
  id: string
  name: string
  query: string
  color: string
}
