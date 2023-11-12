import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { CalendarEvent } from '@/types/fullcalendar'
import type { AgendaTaskWithStart } from '@/types/task'
import { padZero } from '@/util/util'

/**
 * transform agenda task to calendar event
 */
export const transformAgendaTaskToCalendarEvent = (
  task: AgendaTaskWithStart,
  options: { showFirstEventInCycleOnly?: boolean; showTimeLog?: boolean } = {},
): CalendarEvent[] => {
  const { showFirstEventInCycleOnly = false, showTimeLog = false } = options
  const { estimatedTime = DEFAULT_ESTIMATED_TIME, timeLogs = [], status, actualTime } = task
  const spanTime = status === 'done' && actualTime && showTimeLog ? actualTime : estimatedTime
  const rrule: CalendarEvent['rrule'] =
    showFirstEventInCycleOnly && task.rrule
      ? {
          ...task.rrule,
          count: 1,
        }
      : task.rrule
  if (showTimeLog && status === 'done' && timeLogs.length) {
    return timeLogs.map((log, index) => ({
      id: task.id + '_' + index,
      title: task.title,
      allDay: false,
      start: log.start.toDate(),
      end: log.end.toDate(),
      extendedProps: task,
      editable: false,
      color: task.project.bgColor,
    }))
  }
  return [
    {
      id: task.id,
      title: task.title,
      allDay: task.allDay,
      start: task.start.toDate(),
      // https://fullcalendar.io/docs/event-parsing
      // end value is exclusive. For example, if you have an all-day event that has an end of 2018-09-03, then it will span through 2018-09-02 and end before the start of 2018-09-03.
      // so we need to add 1 day
      end: task.end ? task.end.add(1, 'day').toDate() : task.start.add(spanTime, 'minute').toDate(),
      extendedProps: task,
      rrule,
      // 只有时间点事件才能传 duration
      duration: task.allDay ? undefined : { minute: spanTime },
      editable: !(task.recurringPast || task.rrule),
      color: task.project.bgColor,
    },
  ]
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
