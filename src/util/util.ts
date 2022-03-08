import dayjs from 'dayjs'
import { flattenDeep, get } from 'lodash'
import en from 'dayjs/locale/en'
import { ISchedule } from 'tui-calendar'
import { DAILY_LOG_CONFIG, DEFAULT_BLOCK_DEADLINE_DATE_FORMAT, DEFAULT_JOURNAL_FORMAT, DEFAULT_LOG_KEY, DEFAULT_SETTINGS, SHOW_DATE_FORMAT } from './constants'

dayjs.locale({
  ...en,
  weekStart: 1,
})


const genCalendarDate = (date: number | string, format = DEFAULT_BLOCK_DEADLINE_DATE_FORMAT) => {
  return dayjs(String(date), format).format()
}

export type ISettingsFormQuery = Partial<{
  script: string
  scheduleStart: string
  scheduleEnd: string
  dateFormatter: string
  isMilestone: boolean
}>
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
    query: ISettingsFormQuery[]
  }[]
}
export const getInitalSettings = (): ISettingsForm => {
  return {
    ...DEFAULT_SETTINGS,
    ...logseq.settings,
  }
}

type IQueryWithCalendar = {
  calendarConfig: ISettingsForm['calendarList'][number]
  query: ISettingsFormQuery
}
export const getSchedules = async () => {
  console.log('[faiz:] === getSchedules start ===', logseq.settings, getInitalSettings())
  let calendarSchedules:ISchedule[] = []

  // get calendar configs
  const { calendarList: calendarConfigs = [], logKey } = getInitalSettings()
  const customCalendarConfigs = calendarConfigs.filter(config => config.enabled)

  let scheduleQueryList: IQueryWithCalendar[] = []

  scheduleQueryList = customCalendarConfigs.map((calendar) => {
    return calendar?.query
            ?.filter(item => item?.script?.length)
            ?.map(item => ({
              calendarConfig: calendar,
              query: item,
            }))
  }).filter(Boolean).flat()

  const queryPromiseList = scheduleQueryList.map(async queryWithCalendar => {
    const { calendarConfig, query } = queryWithCalendar
    const { script = '', scheduleStart = '', scheduleEnd = '', dateFormatter, isMilestone } = query
    const blocks = await logseq.DB.datascriptQuery(script)
    console.log('[faiz:] === search blocks by query: ', script, blocks)

    return flattenDeep(blocks).map(block => {

      const start = get(block, scheduleStart, undefined)
      const end = get(block, scheduleEnd, undefined)
      let hasTime = /[Hhm]+/.test(dateFormatter || '')

      let _start = start && genCalendarDate(start, dateFormatter)
      let _end = end && genCalendarDate(end, dateFormatter)
      if (start && ['scheduled', 'deadline'].includes(scheduleStart)) {
        const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleStart.toUpperCase()}:`))?.trim()
        const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
        if (time) {
          _start = dayjs(`${start} ${time}`, 'YYYYMMDD HH:mm').format()
          hasTime = true
        }
      }
      if (end && ['scheduled', 'deadline'].includes(scheduleEnd)) {
        const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleEnd.toUpperCase()}:`))?.trim()
        const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
        if (time) {
          _end = dayjs(`${end} ${time}`, 'YYYYMMDD HH:mm').format()
          hasTime = true
        }
      }

      let _category: ICategory = hasTime ? 'time' : 'allday'
      if (isMilestone) _category = 'milestone'
      const _isOverdue = isOverdue(block, end || start)
      if (!isMilestone && _isOverdue) _category = 'task'

      const schedule = genSchedule({
        blockData: block,
        category: _category,
        start: _start,
        end: _end,
        calendarConfig,
      })
      // show overdue tasks in today
      return _isOverdue
        ? [
          schedule,
          genSchedule({
            blockData: block,
            category: _category,
            calendarConfig,
          })
        ]
        : schedule
    })
  })

  const scheduleRes = await Promise.allSettled(queryPromiseList)
  const scheduleResFulfilled:ISchedule[] = []
  scheduleRes.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      scheduleResFulfilled.push(res.value)
    } else {
      console.error('[faiz:] === scheduleRes error: ', scheduleQueryList[index], res)
      const { calendarConfig, query } = scheduleQueryList[index]
      const msg = `Query Exec Error:
calendar: ${calendarConfig.id}
query: ${query.script}
message: ${res.reason.message}`
      logseq.App.showMsg(msg, 'error')
    }
  })
  calendarSchedules = flattenDeep(calendarSchedules.concat(scheduleResFulfilled))

  // Daily Logs
  if (logKey) {
    const logs = await logseq.DB.q(`[[${logKey}]]`)
    const _logs = logs
                  ?.filter(block => block.content?.trim() === `[[${logKey}]]`)
                  ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                  ?.flat()
                  ?.filter(block => {
                    const _content = block.content?.trim()
                    return _content.length > 0 && block?.page?.journalDay && !block.marker && !block.scheduled && !block.deadline
                  }) || []
    console.log('[faiz:] === logs', _logs)
    calendarSchedules = calendarSchedules.concat(_logs?.map(block => {
      const date = block?.page?.journalDay
      const { start: _startTime, end: _endTime } = getTimeInfo(block?.content.replace(new RegExp(`^${block.marker} `), ''))
      return genSchedule({
        blockData: block,
        category: (_startTime || _endTime) ? 'time' : 'allday',
        start: _startTime ? dayjs(date + ' ' + _startTime, 'YYYYMMDD HH:mm').format() : genCalendarDate(date),
        end: _endTime ? dayjs(date + ' ' + _endTime, 'YYYYMMDD HH:mm').format() : undefined,
        calendarConfig: DEFAULT_SETTINGS.calendarList[0],
        // calendarConfig: DAILY_LOG_CONFIG as ISettingsForm['calendarList'][number],
      })
    }))
  }

  return calendarSchedules
}

type ICategory = 'time' | 'allday' | 'milestone' | 'task'
function genSchedule(params: {
  blockData: any
  category: ICategory
  start?: string
  end?:string
  calendarConfig: ISettingsForm['calendarList'][number]
  isAllDay?: boolean
}) {
  const { blockData, category = 'time', start, end, calendarConfig, isAllDay } = params
  const title = blockData.content
                  .split('\n')[0]
                  ?.replace(new RegExp(`^${blockData.marker} `), '')
                  ?.replace(/^(\d{2}:\d{2})(-\d{2}:\d{2})*/, '')
                  ?.trim?.()
  const isDone = blockData.marker === 'DONE'
  return {
    id: blockData.id,
    calendarId: calendarConfig.id,
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
    customStyle: isDone ? 'opacity: 0.65;' : '',
  }
}

/**
 * 获取周报
 */
export const getWeekly = async (startDate, endDate) => {
  const keyword = logseq.settings?.logKey || DEFAULT_LOG_KEY
  const journalFormat = logseq.settings?.journalDateFormatter || DEFAULT_JOURNAL_FORMAT
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

/**
 * 提取时间信息
 * eg: '12:00 foo' => { start: '12:00', end: undefined }
 * eg: '12:00-13:00 foo' => { start: '12:00', end: '13:00' }
 * eg: 'foo' => { start: undefined, end: undefined }
 */
export const getTimeInfo = (content: string) => {
  const reg = /^(\d{2}:\d{2})(-\d{2}:\d{2})*/
  const res = content.match(reg)
  if (res) return { start: res[1], end: res[2]?.slice(1) }
  return { start: undefined, end: undefined }
}

export const initializeSettings = () => {
  const settings = logseq.settings
  // settings未初始化时手动初始化
  if (!settings?.initialized) {
    const _settings = getInitalSettings()
    logseq.updateSettings({ ..._settings, initialized: true })
    console.log('[faiz:] === initialize settings success', logseq.settings)
  }
}

export const genDefaultQuery = (pageName: string) => {
  return {
    id: pageName,
    bgColor: '#b8e986',
    textColor: '#4a4a4a',
    borderColor: '#047857',
    enabled: true,
    query: [
      // scheduled tasks
      {
        script: `
[:find (pull ?block [*])
:where
[?block :block/marker ?marker]
[(missing? $ ?block :block/deadline)]
(not [(missing? $ ?block :block/scheduled)])
[?page :block/name ?pname]
[?block :block/page ?page]
[(contains? #{"${pageName}"} ?pname)]
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'scheduled',
        dateFormatter: 'YYYYMMDD',
      },
      // deadline tasks
      {
        script: `
[:find (pull ?block [*])
:where
[?block :block/marker ?marker]
[(missing? $ ?block :block/scheduled)]
[(get-else $ ?block :block/deadline "nil") ?d]
[(not= ?d "nil")]
[?page :block/name ?pname]
[?block :block/page ?page]
[(contains? #{"${pageName}"} ?pname)]
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'deadline',
        dateFormatter: 'YYYYMMDD',
      },
      // milestone
      {
        script: `
[:find (pull ?block [*])
:where
[?page :block/name ?pname]
[?block :block/page ?page]
[(contains? #{"${pageName}"} ?pname)]
[?rp :block/name "milestone"]
[?block :block/refs ?rp]]
        `,
        scheduleStart: 'scheduled',
        dateFormatter: 'YYYYMMDD',
        isMilestone: true,
      }
    ],
  }
}

export const log = (msg, color='blue') => console.log(`%c${msg}`, `color:${color}`)