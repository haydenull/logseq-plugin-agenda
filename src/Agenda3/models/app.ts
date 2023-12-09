import { atom } from 'jotai'

import { type CalendarView } from '@/Agenda3/components/calendar/CalendarAdvancedOperation'
import type { AgendaTaskObjective } from '@/types/objective'

export type App = {
  view: 'tasks' | 'calendar'
  rightSidebarFolded: boolean
  calendarView: CalendarView
  sidebarType: 'timebox' | 'backlog' | 'objective'
  objectivePeriod?: AgendaTaskObjective
}
export const appAtom = atom<App>({
  view: 'tasks',
  rightSidebarFolded: false,
  calendarView: 'dayGridMonth',
  sidebarType: 'timebox',
})
