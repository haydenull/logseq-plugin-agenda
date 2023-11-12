import { atom } from 'jotai'

export type Settings = {
  ics?: {
    repo?: string
    token?: string
  }
  viewOptions?: {
    hideCompleted?: boolean
    showFirstEventInCycleOnly?: boolean
    showTimeLog?: boolean
  }
}
export const settingsAtom = atom<Settings>({ viewOptions: { showTimeLog: false } })
