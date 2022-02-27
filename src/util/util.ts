import dayjs from 'dayjs'
import en from 'dayjs/locale/en'
import { ISchedule } from 'tui-calendar'
import { DEFAULT_BLOCK_DEADLINE_DATE_FORMAT, DEFAULT_JOURNAL_FORMAT, DEFAULT_LOG_KEY, SHOW_DATE_FORMAT } from './constants'

dayjs.locale({
  ...en,
  weekStart: 1,
})


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
export const getInitalSettings = (): ISettingsForm => {
  return {
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
  }
}

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
    const time = / (\d{2}:\d{2})[ >]/.exec(scheduledString)?.[1] || ''
    // TODO: show overdue deadline and not done scheduled
    if (block.deadline) {
      // DEADLINE
      return genSchedule({
        blockData: block,
        category: isOverdue(block, block.deadline) ? 'task' : 'allday',
        start: genCalendarDate(block.deadline),
        calendarConfigs: _calendarConfigs,
      })
    } else if (time) {
      // SCHEDULED with time
      return genSchedule({
        blockData: block,
        category: isOverdue(block, block.scheduled) ? 'task' : 'time',
        start: dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm').format(),
        calendarConfigs: _calendarConfigs,
      })
    } else {
      // SCHEDULED without time
      return genSchedule({
        blockData: block,
        category: isOverdue(block, block.scheduled) ? 'task' : 'allday',
        start: genCalendarDate(block.scheduled),
        calendarConfigs: _calendarConfigs,
        isAllDay: true,
      })
    }
  }))


  // Tasks(tasks in journal but without scheduled or deadline)
  const tasks = await logseq.DB.q(`(and (task todo later now doing done))`)
  const _task = tasks?.filter(block => block?.page?.journalDay && !block.scheduled && !block.deadline) || []
  console.log('[faiz:] === tasks', _task)
  calendarSchedules = calendarSchedules.concat(_task?.map(block => {
    return genSchedule({
      blockData: block,
      category: isOverdue(block, block.page.journalDay) ? 'task' : 'allday',
      start: genCalendarDate(block.page.journalDay),
      calendarConfigs: _calendarConfigs,
      isJournal: true,
    })
  }))

  // Daily Logs
  // TODO: support end time
  const keyword = logseq.settings?.logKey || DEFAULT_LOG_KEY
  const logs = await logseq.DB.q(`[[${keyword}]]`)
  const _logs = logs
                ?.filter(block => block.content?.trim() === `[[${keyword}]]`)
                ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                ?.flat()
                ?.filter(block => {
                  const _content = block.content?.trim()
                  return _content.length > 0 && block?.page?.journalDay && !block.marker && !block.scheduled && !block.deadline
                }) || []
  console.log('[faiz:] === logs', _logs)
  calendarSchedules = calendarSchedules.concat(_logs?.map(block => {
    const date = block?.page?.journalDay
    const time = block.content?.substr(0, 5)
    const hasTime = time.split(':')?.filter(num => !Number.isNaN(Number(num)))?.length === 2
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
  start?: string
  end?:string
  calendarConfigs: Array<ISettingsForm['calendarList'][number] & { pageId?: number }>
  isAllDay?: boolean
  isJournal?: boolean
}) {
  const { blockData, category = 'time', start, end, calendarConfigs, isAllDay, isJournal } = params
  const calendarId = calendarConfigs.find(calendar => calendar.pageId === blockData?.page?.id)?.id || 'journal'

  let calendarConfig = calendarConfigs.find(config => config.id === 'journal')
  // if is custom calendar
  if (!isJournal && calendarId !== 'journal') {
    calendarConfig = calendarConfigs.find(config => config.id === calendarId)
  }

  const title = blockData.content
                  .split('\n')[0]
                  ?.replace(new RegExp(`^${blockData.marker}`), '')
                  ?.replace(/^\d{2}:\d{2}/, '')
                  ?.trim?.()

  return {
    id: blockData.id,
    calendarId,
    title,
    body: blockData.content,
    category,
    dueDateClass: '',
    start,
    end,
    raw: blockData,
    color: calendarConfig?.textColor,
    bgColor: calendarConfig?.bgColor,
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

/**
 * 判断是否过期
 */
export const isOverdue = (block: any, date: number | string) => {
  if (block.marker && block.marker !== 'DONE') {
    const now = dayjs()
    const _date = dayjs(String(date), DEFAULT_BLOCK_DEADLINE_DATE_FORMAT)
    return now.isAfter(_date, 'day')
  }
  // 非 todo 及 done 的 block 不过期
  return false
}