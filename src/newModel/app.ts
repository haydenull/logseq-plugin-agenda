import { atom } from 'jotai'

export type App = {
  view: 'tasks' | 'calendar'
}
export const appAtom = atom<App>({
  view: 'tasks',
})
