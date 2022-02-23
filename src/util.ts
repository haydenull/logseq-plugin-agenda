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

export type ISettingsForm = {
  defaultView: string
  weekStartDay: 0 | 1
  journalDateFormatter: string
  logKey: string
  calendarList: {
    id: string
    bgColor: string
    textColor: string
    borderColor: string
    enabled: boolean
  }[]
}
export const getInitalSettings = (): ISettingsForm => ({
  defaultView: logseq.settings?.defaultView || 'week',
  weekStartDay: logseq.settings?.weekStartDay || 0,
  journalDateFormatter: logseq.settings?.journalDateFormatter || 'YYYY-MM-DD ddd',
  logKey: logseq.settings?.logKey || 'Daily Log',
  calendarList: logseq.settings?.calendarList || [
    {
      id: 'journal',
      bgColor: '#047857',
      textColor: '#fff',
      borderColor: '#047857',
      enabled: true,
    },
  ],
})

export const getSchedules = async () => {
  console.log('[faiz:] === getSchedules start ===', logseq.settings, getInitalSettings())
  let calendarSchedules:ISchedule[] = []

  // get calendar configs
  const { calendarList: calendarConfigs = [] } = getInitalSettings()
  const journalCalendar = calendarConfigs.find(calendar => calendar.id === 'journal')
  const customCalendarConfigs = calendarConfigs.filter(calendar => calendar.id !== 'journal' && calendar.enabled)
  const customCalendarPromises = await Promise.all(customCalendarConfigs.map(calendar => logseq.Editor.getPage(calendar.id)))
  const _customCalendarConfigs = customCalendarPromises?.map((pageData, index) => {
                                const pageId = pageData?.id
                                return { ...customCalendarConfigs[index], pageId }
                              })
const _calendarConfigs = journalCalendar ? [journalCalendar, ..._customCalendarConfigs] : _customCalendarConfigs
  console.log('[faiz:] === customCalendarConfigs', _calendarConfigs)

  // Scheduled and Deadline
  const scheduledAndDeadlineBlocks = await logseq.DB.datascriptQuery(`
    [:find (pull ?block [*])
      :where
      (or
        [?block :block/scheduled ?d]
        [?block :block/deadline ?d])
      [(not= ?d "nil")]]
  `)
  console.log('[faiz:] === scheduledAndDeadlineBlocks', scheduledAndDeadlineBlocks)
  calendarSchedules = calendarSchedules.concat(scheduledAndDeadlineBlocks.flat().map(block => {
    const scheduledString = block.content?.split('\n')?.find(l => l.startsWith('SCHEDULED:'))?.trim()
    const time = / \d{2}:\d{2}[ >]/.exec(scheduledString)?.[1] || ''
    if (block.deadline) {
      return genSchedule({
        blockData: block,
        category: 'milestone',
        start: genCalendarDate(block.deadline),
        calendarConfigs: _calendarConfigs,
      })
      // return {
      //   id: block.id,
      //   calendarId: 'journal',
      //   title: block.content,
      //   body: block.content,
      //   category: 'milestone',
      //   dueDateClass: '',
      //   start: genCalendarDate(block.deadline),
      //   isAllDay: false,
      //   raw: block,
      // }
    } else if (time) {
      // return {
      //   id: block.id,
      //   calendarId: 'journal',
      //   title: block.content,
      //   body: block.content,
      //   category: 'time',
      //   dueDateClass: '',
      //   start: dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm').format(),
      //   raw: block,
      // }
      return genSchedule({
        blockData: block,
        category: 'time',
        start: dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm').format(),
        calendarConfigs: _calendarConfigs,
      })
    } else {
      // return {
      //   id: block.id,
      //   calendarId: 'journal',
      //   title: block.content,
      //   body: block.content,
      //   category: 'allday',
      //   dueDateClass: '',
      //   start: genCalendarDate(block.scheduled),
      //   isAllDay: true,
      //   raw: block,
      // }
      return genSchedule({
        blockData: block,
        category: 'allday',
        start: genCalendarDate(block.scheduled),
        calendarConfigs: _calendarConfigs,
        isAllDay: true,
      })
    }
  }))


  // Tasks(logseq block's marker is not nil except scheduled and deadline and in journal)
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
  calendarSchedules = calendarSchedules.concat(_task?.map(block => {
    // return {
    //   id: block.id,
    //   calendarId: 'journal',
    //   title: block.content,
    //   body: block.content,
    //   category: 'task',
    //   dueDateClass: '',
    //   start: genCalendarDate(block.page.journalDay),
    //   raw: block,
    // }
    return genSchedule({
      blockData: block,
      category: 'task',
      start: genCalendarDate(block.page.journalDay),
      calendarConfigs: _calendarConfigs,
      isJournal: true,
    })
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
  calendarSchedules = calendarSchedules.concat(_logs?.map(block => {
    const date = block?.page?.journalDay
    const time = block.content?.substr(0, 5)
    const hasTime = time.split(':')?.filter(num => !Number.isNaN(Number(num)))?.length === 2
    // return {
    //   id: block.id,
    //   calendarId: 'journal',
    //   title: block.content,
    //   body: block.content,
    //   category: hasTime ? 'time' : 'allday',
    //   dueDateClass: '',
    //   start: hasTime ? dayjs(date + ' ' + time, 'YYYYMMDD HH:mm').format() : genCalendarDate(date),
    //   // end: hasTime ? day(date + ' ' + time, 'YYYYMMDD HH:mm').add(1, 'hour').format() : day(date, 'YYYYMMDD').add(1, 'day').format(),
    //   raw: block,
    // }
    return genSchedule({
      blockData: block,
      category: hasTime ? 'time' : 'allday',
      start: hasTime ? dayjs(date + ' ' + time, 'YYYYMMDD HH:mm').format() : genCalendarDate(date),
      // end: hasTime ? day(date + ' ' + time, 'YYYYMMDD HH:mm').add(1, 'hour').format() : day(date, 'YYYYMMDD').add(1, 'day').format(),
      calendarConfigs: _calendarConfigs,
      isJournal: true,
    })
  }))

  console.log('[faiz:] === calendarSchedules', calendarSchedules)
  return calendarSchedules
}

function genSchedule(params: {
  blockData: any
  category: 'time' | 'allday' | 'milestone' | 'task'
  start: string
  calendarConfigs: Array<ISettingsForm['calendarList'][number] & { pageId?: number }>
  isAllDay?: boolean
  isJournal?: boolean
}) {
  const { blockData, category = 'time', start, calendarConfigs, isAllDay, isJournal } = params
  const calendarId = calendarConfigs.find(calendar => calendar.pageId === blockData?.page?.id)?.id || 'journal'

  let calendarConfig = calendarConfigs.find(config => config.id === 'journal')
  // if is custom calendar
  if (!isJournal && calendarId !== 'journal') {
    calendarConfig = calendarConfigs.find(config => config.id === calendarId)
  }

  return {
    id: blockData.id,
    calendarId,
    title: blockData.content,
    body: blockData.content,
    category,
    dueDateClass: '',
    start,
    raw: blockData,
    bgColor: calendarConfig?.bgColor,
    textColor: calendarConfig?.textColor,
    borderColor: calendarConfig?.borderColor,
    isAllDay,
  }
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