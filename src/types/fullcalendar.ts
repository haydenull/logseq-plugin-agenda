import type { AgendaTaskWithStart } from './task'

/** https://github.com/jkbrzt/rrule */
export type RRule = {
  freq: string // hourly daily weekly monthly yearly
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
}
