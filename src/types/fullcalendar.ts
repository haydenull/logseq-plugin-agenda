import type { FREQ_ENUM_MAP } from '@/newHelper/task'

import type { AgendaTaskWithStart } from './task'

/** https://github.com/jkbrzt/rrule */
export type RRule = {
  freq: keyof typeof FREQ_ENUM_MAP
  interval: number
  dtstart: string
}
// https://fullcalendar.io/docs/event-object
export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  extendedProps: AgendaTaskWithStart
  allDay: boolean
  rrule?: RRule
  editable?: boolean
  color?: string
  textColor?: string
  duration?: { minute: number } // rrule event duration
}
