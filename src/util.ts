import dayjs from 'dayjs'
import en from 'dayjs/locale/en'
import { ISchedule } from 'tui-calendar'

dayjs.locale({
  ...en,
  weekStart: 1,
})

export const SHOW_DATE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_JOURNAL_FORMAT = 'YYYY-MM-DD ddd'
export const DEFAULT_LOG_KEY = 'Daily Log'
export const CALENDAR_VIEWS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

const DEFAULT_BLOCK_DEADLINE_DATE_FORMAT = "YYYYMMDD"
const genCalendarDate = (date: number | string, format = DEFAULT_BLOCK_DEADLINE_DATE_FORMAT) => {
  return dayjs(String(date), format).format()
}

export const getSchedules = async () => {
  console.log('[faiz:] === getSchedules start ===')
  let calendatSchedules:ISchedule[] = []
  // const calendarSchedulesMap = new Map()

  // Scheduled and Deadline
  const scheduledAndDeadlineBlocks = await logseq.DB.datascriptQuery(`
    [:find (pull ?block [*])
      :where
      (or
        [?block :block/scheduled ?d]
        [?block :block/deadline ?d])
      [(not= ?d "nil")]]
  `)
  calendatSchedules = calendatSchedules.concat(scheduledAndDeadlineBlocks.flat().map(block => {
    // calendarSchedulesMap.set(block.id, block)
    const scheduledString = block.content?.split('\n')?.find(l => l.startsWith('SCHEDULED:'))?.trim()
    const time = / \d{2}:\d{2}[ >]/.exec(scheduledString)?.[1] || ''
    if (block.deadline) {
      return {
        id: block.id,
        calendarId: 'journal',
        title: block.content,
        body: block.content,
        category: 'milestone',
        dueDateClass: '',
        start: genCalendarDate(block.deadline),
        isAllDay: false,
      }
    } else if (time) {
      return {
        id: block.id,
        calendarId: 'journal',
        title: block.content,
        body: block.content,
        category: 'time',
        dueDateClass: '',
        start: dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm').format(),
      }
    } else {
      return {
        id: block.id,
        calendarId: 'journal',
        title: block.content,
        body: block.content,
        category: 'allday',
        dueDateClass: '',
        start: genCalendarDate(block.scheduled),
        isAllDay: true,
      }
    }
  }))
  console.log('[faiz:] === scheduledAndDeadlineBlocks', scheduledAndDeadlineBlocks)


  // Tasks(logseq block's marker is not nil except scheduled and deadline)
  // const taskss = await logseq.DB.datascriptQuery(`
  //   [:find (pull ?block [*])
  //     :where
  //     [?block :block/marker ?marker]
  //     [?block :block/journal? true]
  //     [(not= ?marker "nil")]]
  // `)
  const tasks = await logseq.DB.q(`(and (task todo later now doing done))`)
  const _task = tasks?.filter(block => block?.page?.journalDay && !block.scheduled && !block.deadline) || []
  console.log('[faiz:] === tasks', _task)
  calendatSchedules = calendatSchedules.concat(_task?.map(block => {
    return {
      id: block.id,
      calendarId: 'journal',
      title: block.content,
      body: block.content,
      category: 'task',
      dueDateClass: '',
      start: genCalendarDate(block.page.journalDay),
    }
  }))

  // Daily Logs
  const keyword = logseq.settings?.logKey || DEFAULT_LOG_KEY
  const logs = await logseq.DB.q(`[[${keyword}]]`)
  const _logs = logs
                ?.filter(block => block.content?.trim() === `[[${keyword}]]`)
                ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                ?.flat()
                ?.filter(block => {
                  const _content = block.content?.trim()
                  return _content.length > 0 && block?.page?.journalDay && !block.scheduled && !block.deadline
                }) || []
  console.log('[faiz:] === logs', _logs)
  calendatSchedules = calendatSchedules.concat(_logs?.map(block => {
    const date = block?.page?.journalDay
    const time = block.content?.substr(0, 5)
    const hasTime = time.split(':')?.filter(num => !Number.isNaN(Number(num)))?.length === 2
    return {
      id: block.id,
      calendarId: 'journal',
      title: block.content,
      body: block.content,
      category: hasTime ? 'time' : 'allday',
      dueDateClass: '',
      start: hasTime ? dayjs(date + ' ' + time, 'YYYYMMDD HH:mm').format() : genCalendarDate(date),
      // end: hasTime ? day(date + ' ' + time, 'YYYYMMDD HH:mm').add(1, 'hour').format() : day(date, 'YYYYMMDD').add(1, 'day').format(),
    }
  }))

  console.log('[faiz:] === calendatSchedules', calendatSchedules)
  return calendatSchedules
}

/**
 * 获取周报
 */
export const getWeekly = async (startDate, endDate) => {
  const keyword = logseq.settings?.logKey || DEFAULT_LOG_KEY
  const journalFormat = logseq.settings?.journalFormat || DEFAULT_JOURNAL_FORMAT
  const _start = dayjs(startDate, SHOW_DATE_FORMAT).format(journalFormat)
  const _end = dayjs(endDate, SHOW_DATE_FORMAT).format(journalFormat)
  const logs = await logseq.DB.q(`(and [[${keyword}]] (between [[${_start}]] [[${_end}]]))`)
  const _logs = logs
                  ?.filter(block => block.content?.trim() === `[[${keyword}]]`)
                  ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                  ?.flat()
                  ?.filter(block => {
                    const _content = block.content?.trim()
                    return _content.length > 0
                  })
  console.log('[faiz:] === weekly logs', _logs)
  return _logs
}