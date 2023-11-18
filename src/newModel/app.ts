import { atom } from 'jotai'

export type App = {
  view: 'tasks' | 'calendar'
  rightSidebarFolded: boolean
}
export const appAtom = atom<App>({
  view: 'tasks',
  rightSidebarFolded: false,
})
