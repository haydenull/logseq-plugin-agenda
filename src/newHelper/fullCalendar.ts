import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { CalendarEvent } from '@/types/fullcalendar'
import type { AgendaTaskWithStart } from '@/types/task'
import { padZero } from '@/util/util'

/**
 * transform agenda task to calendar event
 */
export const transformAgendaTaskToCalendarEvent = (task: AgendaTaskWithStart): CalendarEvent => {
  const { estimatedTime = DEFAULT_ESTIMATED_TIME } = task
  const spanTime = task.status === 'done' && task.actualTime ? task.actualTime : estimatedTime
  return {
    id: task.id,
    title: task.title,
    allDay: task.allDay,
    start: task.start.toDate(),
    // https://fullcalendar.io/docs/event-parsing
    // end value is exclusive. For example, if you have an all-day event that has an end of 2018-09-03, then it will span through 2018-09-02 and end before the start of 2018-09-03.
    // so we need to add 1 day
    end: task.end ? task.end.add(1, 'day').toDate() : task.start.add(spanTime, 'minute').toDate(),
    extendedProps: task,
    rrule: task.rrule,
    editable: !(task.recurringPast || task.rrule),
  }
}

/**
 * transform agenda timeLogs to calendar events
 */
export const transformAgendaTimeLogsToCalendarEvents = (task: AgendaTaskWithStart): CalendarEvent[] => {
  const { title, id, timeLogs = [] } = task
  return timeLogs.map((log, index) => {
    return {
      id: `${id}_${index}`,
      allDay: false,
      title,
      start: log.start.toDate(),
      end: log.end.toDate(),
      extendedProps: task,
    }
  })
}

/**
 * minutes number to HH:mm
 * 68 -> 01:08
 */
export const minutesToHHmm = (minutes?: number): string => {
  if (!minutes) return '00:00'
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${padZero(hour)}:${padZero(minute)}`
}

/**
 * seconds number to HH:mm:ss
 */
export const secondsToHHmmss = (seconds: number): string => {
  const hour = Math.floor(seconds / 3600)
  const minute = Math.floor((seconds % 3600) / 60)
  const second = Math.floor(seconds % 60)
  return `${padZero(hour)}:${padZero(minute)}:${padZero(second)}`
}
