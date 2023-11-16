import { atom } from 'jotai'

export type Settings = {
  general?: {
    useJournalDayAsSchedule?: boolean
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
}
export const settingsAtom = atom<Settings>({ viewOptions: { showTimeLog: false } })

export type Filter = {
  id: string
  name: string
  query: string
}
