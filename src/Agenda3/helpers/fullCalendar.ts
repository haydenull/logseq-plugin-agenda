import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { CalendarEvent } from '@/types/fullcalendar'
import type { AgendaTaskWithDeadline, AgendaTaskWithStart, AgendaTaskWithStartOrDeadline } from '@/types/task'
import { padZero } from '@/util/util'

/**
 * transform agenda task to calendar event
 */
export const transformAgendaTaskToCalendarEvent = (
  task: AgendaTaskWithStartOrDeadline,
  options: { showFirstEventInCycleOnly?: boolean; showTimeLog?: boolean; groupType: 'filter' | 'page' } = {
    groupType: 'page',
  },
): CalendarEvent[] => {
  const { showFirstEventInCycleOnly = false, showTimeLog = false, groupType } = options
  const { estimatedTime = DEFAULT_ESTIMATED_TIME, timeLogs = [], status, actualTime } = task
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
      color: groupType === 'page' ? task.project.bgColor : task.filters?.[0]?.color,
    }))
  }
  let spanTime: number
  let start: Date
  let end: Date
  let allDay: boolean
  if (task.start) {
    const _task = task as AgendaTaskWithStart
    allDay = _task.allDay
    spanTime = status === 'done' && actualTime && showTimeLog ? actualTime : estimatedTime
    start = _task.start.toDate()
    end = _task.end ? _task.end.add(1, 'day').toDate() : _task.start.add(spanTime, 'minute').toDate()
  } else {
    const _task = task as AgendaTaskWithDeadline
    allDay = _task.deadline.allDay
    spanTime = DEFAULT_ESTIMATED_TIME
    start = _task.deadline.value.toDate()
    end = _task.deadline.allDay
      ? _task.deadline.value.add(1, 'day').toDate()
      : _task.deadline.value.add(spanTime, 'minute').toDate()
  }

  return [
    {
      id: task.id,
      title: task.title,
      allDay,
      start,
      // https://fullcalendar.io/docs/event-parsing
      // end value is exclusive. For example, if you have an all-day event that has an end of 2018-09-03, then it will span through 2018-09-02 and end before the start of 2018-09-03.
      // so we need to add 1 day
      end,
      extendedProps: task,
      rrule,
      // 只有时间点事件才能传 duration
      duration: allDay ? undefined : { minute: spanTime },
      editable: !(task.recurringPast || task.rrule),
      color: groupType === 'page' ? task.project.bgColor : task.filters?.[0]?.color,
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
