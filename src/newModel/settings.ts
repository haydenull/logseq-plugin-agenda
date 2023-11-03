import { atom } from 'jotai'

export type Settings = {
  ics?: {
    repo?: string
    token?: string
  }
  viewOptions?: {
    hideCompleted?: boolean
    showFirstEventInCycleOnly?: boolean
  }
}
export const settingsAtom = atom<Settings>({})
