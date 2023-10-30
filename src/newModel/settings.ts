import { atom } from 'jotai'

export type Settings = {
  ics?: {
    repo?: string
    token?: string
  }
}
export const settingsAtom = atom<Settings>({})
