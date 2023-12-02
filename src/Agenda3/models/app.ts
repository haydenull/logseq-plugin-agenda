import { atom } from 'jotai'

import { type CalendarView } from '@/Agenda3/components/calendar/CalendarAdvancedOperation'

export type App = {
  view: 'tasks' | 'calendar'
  rightSidebarFolded: boolean
  calendarView: CalendarView
}
export const appAtom = atom<App>({
  view: 'tasks',
  rightSidebarFolded: false,
  calendarView: 'dayGridMonth',
})
