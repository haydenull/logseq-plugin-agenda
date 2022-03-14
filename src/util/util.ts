import { addHours, addMinutes, endOfDay, format, formatISO, isAfter, parse, parseISO, startOfDay } from 'date-fns'
import { flattenDeep, get } from 'lodash'
// import en from 'dayjs/locale/en'
import { ISchedule } from 'tui-calendar'
import { DEFAULT_BLOCK_DEADLINE_DATE_FORMAT, DEFAULT_JOURNAL_FORMAT, DEFAULT_SETTINGS, SHOW_DATE_FORMAT } from './constants'
import axios from 'axios'
import ical from 'ical.js'

// dayjs.locale({
//   ...en,
//   weekStart: 1,
// })


const genCalendarDate = (date: number | string, format = DEFAULT_BLOCK_DEADLINE_DATE_FORMAT) => {
  return formatISO(parse('' + date, format, new Date()))
}

type ICustomCalendar = {
  id: string
  bgColor: string
  textColor: string
  borderColor: string
  enabled: boolean
}
export type ISettingsFormQuery = Partial<{
  script: string
  scheduleStart: string
  scheduleEnd: string
  dateFormatter: string
  isMilestone: boolean
  queryType: 'simple' | 'advanced'
}>
export type ISettingsForm = {
  theme?: 'light' | 'dark' | 'auto'
  defaultView: string
  weekStartDay: 0 | 1
  // journalDateFormatter: string
  defaultDuration: {
    unit: string
    value: number
  },
  logKey?: ICustomCalendar
  calendarList: Array<ICustomCalendar & { query: ISettingsFormQuery[] }>
  subscriptionList?: Array<ICustomCalendar & { url: string }>
}
export const getInitalSettings = (): ISettingsForm => {
  let logKey = logseq.settings?.logKey
  // 适配 logKey 参数变化
  if (typeof logKey === 'string') {
    logKey = {
      ...DEFAULT_SETTINGS.logKey,
      id: logKey,
    }
  }
  return {
    ...DEFAULT_SETTINGS,
    ...logseq.settings,
    logKey,
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
  const { calendarList: calendarConfigs = [], logKey, defaultDuration, subscriptionList } = getInitalSettings()
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
    const { script = '', scheduleStart = '', scheduleEnd = '', dateFormatter, isMilestone, queryType } = query
    let blocks: any[] = []
    if (queryType === 'simple') {
      blocks = await logseq.DB.q(script) || []
    } else {
      blocks = await logseq.DB.datascriptQuery(script)
    }
    console.log('[faiz:] === search blocks by query: ', script, blocks)

    return flattenDeep(blocks).map(block => {

      const _dateFormatter = ['scheduled', 'deadline'].includes(scheduleStart || scheduleEnd) ? DEFAULT_BLOCK_DEADLINE_DATE_FORMAT : dateFormatter || DEFAULT_JOURNAL_FORMAT
      const start = get(block, scheduleStart, undefined)
      const end = get(block, scheduleEnd, undefined)
      let hasTime = /[Hhm]+/.test(_dateFormatter || '')

      let _start = start && genCalendarDate(start, _dateFormatter)
      let _end = end && (hasTime ? genCalendarDate(end, _dateFormatter) : formatISO(endOfDay(parse(end, _dateFormatter, new Date()))))
      if (start && ['scheduled', 'deadline'].includes(scheduleStart)) {
        const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleStart.toUpperCase()}:`))?.trim()
        const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
        if (time) {
          _start = formatISO(parse(`${start} ${time}`, 'yyyyMMdd HH:mm', new Date()))
          hasTime = true
        }
      }
      if (end && ['scheduled', 'deadline'].includes(scheduleEnd)) {
        const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleEnd.toUpperCase()}:`))?.trim()
        const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
        if (time) {
          _end = formatISO(parse(_end, 'yyyyMMdd HH:mm', new Date()))
          hasTime = true
        }
      }

      let _category: ICategory = hasTime ? 'time' : 'allday'
      if (isMilestone) _category = 'milestone'
      const _isOverdue = isOverdue(block, _end || _start)
      if (!isMilestone && _isOverdue) _category = 'task'

      const schedule = genSchedule({
        blockData: block,
        category: _category,
        start: _start,
        end: _end,
        calendarConfig,
        defaultDuration,
        isAllDay: !isMilestone && !hasTime,
      })
      // show overdue tasks in today
      return _isOverdue
        ? [
          schedule,
          genSchedule({
            blockData: block,
            category: _category,
            calendarConfig,
            defaultDuration,
            isAllDay: !isMilestone && !hasTime,
          }),
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
  if (logKey?.enabled) {
    const logs = await logseq.DB.q(`[[${logKey.id}]]`)
    const _logs = logs
                  ?.filter(block => {
                    if (block.headingLevel && block.format === 'markdown') {
                      block.content = block.content.replace(new RegExp(`^#{${block.headingLevel}} `), '')
                    }
                    return block.content?.trim() === `[[${logKey.id}]]`
                  })
                  ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                  ?.flat()
                  ?.filter(block => {
                    const _content = block.content?.trim()
                    return _content.length > 0 && block?.page?.journalDay && !block.marker && !block.scheduled && !block.deadline
                  }) || []

    calendarSchedules = calendarSchedules.concat(_logs?.map(block => {
      const date = block?.page?.journalDay
      const { start: _startTime, end: _endTime } = getTimeInfo(block?.content.replace(new RegExp(`^${block.marker} `), ''))
      const hasTime = _startTime || _endTime
      return genSchedule({
        blockData: block,
        category: hasTime ? 'time' : 'allday',
        start: _startTime ? formatISO(parse(date + ' ' + _startTime, 'yyyyMMdd HH:mm', new Date())) : genCalendarDate(date),
        end: _endTime ? formatISO(parse(date + ' ' + _endTime, 'yyyyMMdd HH:mm', new Date())) : undefined,
        calendarConfig: logKey,
        defaultDuration,
        isAllDay: !hasTime,
      })
    }))
  }

  let subSchedules = []
  try {
    subSchedules = await getSubCalendarSchedules(subscriptionList, defaultDuration)
  } catch (error) {
    console.log('[faiz:] === getSubCalendarSchedules error', error)
    logseq.App.showMsg('Get Subscription Schedule Error', 'error')
  }
  calendarSchedules = calendarSchedules.concat(subSchedules)

  return calendarSchedules
}

type ICategory = 'time' | 'allday' | 'milestone' | 'task'
function genSchedule(params: {
  blockData: any
  category: ICategory
  start?: string
  end?:string
  calendarConfig: Omit<ISettingsForm['calendarList'][number], 'query'>
  isAllDay?: boolean
  defaultDuration?: ISettingsForm['defaultDuration']
}) {
  const { blockData, category = 'time', start, end, calendarConfig, isAllDay, defaultDuration } = params
  const title = blockData.content
                  .split('\n')[0]
                  ?.replace(new RegExp(`^${blockData.marker} `), '')
                  ?.replace(/^(\d{2}:\d{2})(-\d{2}:\d{2})*/, '')
                  ?.trim?.()
  const isDone = blockData.marker === 'DONE'

  const { defaultDuration: _defaultDuration } = DEFAULT_SETTINGS
  let _end = end
  if (category === 'time' && !end && start && defaultDuration) {
    const value = defaultDuration.value || _defaultDuration.value
    const unit = defaultDuration.unit || _defaultDuration.unit
    const addDuration = unit === 'm' ? addMinutes : addHours
    _end = formatISO(addDuration(parseISO(start), value))
  }

  return {
    id: blockData.id,
    calendarId: calendarConfig.id,
    title: isDone ? `✅${title}` : title,
    body: blockData.content,
    category,
    dueDateClass: '',
    start,
    end: _end,
    raw: blockData,
    color: calendarConfig?.textColor,
    bgColor: calendarConfig?.bgColor,
    borderColor: calendarConfig?.borderColor,
    isAllDay,
    customStyle: isDone ? 'opacity: 0.6;' : '',
  }
}

/**
 * 获取周报
 */
export const getWeekly = async (startDate, endDate) => {
  const keyword = logseq.settings?.logKey?.id || DEFAULT_SETTINGS.logKey?.id
  const { preferredDateFormat } = await logseq.App.getUserConfigs()
  const journalFormat = preferredDateFormat || DEFAULT_JOURNAL_FORMAT
  const _start = format(parse(startDate, SHOW_DATE_FORMAT, new Date()), journalFormat)
  const _end = format(parse(endDate, SHOW_DATE_FORMAT, new Date()), journalFormat)
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
export const isOverdue = (block: any, date: string) => {
  if (block.marker && block.marker !== 'DONE') {
    return isAfter(startOfDay(new Date()), parseISO(date))
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
        dateFormatter: 'yyyyMMdd',
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
        dateFormatter: 'yyyyMMdd',
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
        dateFormatter: 'yyyyMMdd',
        isMilestone: true,
      }
    ],
  }
}

// TODO: 完善默认配置
export const genAgendaQuery = (pageName: string) => {
  return {
    id: pageName,
    bgColor: '#b8e986',
    textColor: '#4a4a4a',
    borderColor: '#047857',
    enabled: true,
    query: [
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
        scheduleStart: 'properties.agenda-start',
        scheduleEnd: 'properties.agenda-end',
        dateFormatter: 'yyyy-MM-dd',
      },
    ]
  }
}

export const log = (msg, color='blue') => console.log(`%c${msg}`, `color:${color}`)

export const setPluginTheme = (theme: 'dark' | 'light') => {
  const html = document.querySelector('html')
  if (theme === 'dark') {
    html?.classList.add('dark')
  } else {
    html?.classList.remove('dark')
  }
}
export const managePluginTheme = async () => {
  const { theme } = logseq.settings as ISettingsForm & {disabled: boolean}
  if (theme === 'dark') return setPluginTheme('dark')
  if (theme === 'light') return setPluginTheme('light')

  const logseqTheme = await logseq.App.getStateFromStore<'dark' | 'light'>('ui/theme')
  setPluginTheme(logseqTheme)
}

/**
 * get ical data
 */
export const getSubCalendarSchedules = async (subscriptionCalendarList: ISettingsForm['subscriptionList'], defaultDuration?: ISettingsForm['defaultDuration']) => {
  if (!Array.isArray(subscriptionCalendarList)) return []
  const enabledCalendarList = subscriptionCalendarList?.filter(calendar => calendar.enabled)
  if (!enabledCalendarList?.length) return []

  const resList = await Promise.allSettled(enabledCalendarList.map(calendar => axios(calendar.url)))

  let schedules = []
  resList.forEach((res, index) => {
    if (res.status === 'rejected') return logseq.App.showMsg(`Get Calendar ${enabledCalendarList[index].id} data error\n${res.reason}`, 'error')
    try {
      const data = ical.parse(res.value.data)
      const { events } = parseVCalendar(data)
      schedules = schedules.concat(events.map(event => {
        const { dtstart, dtend, summary, description } = event
        const hasTime = dtstart.type === 'date-time'
        return genSchedule({
          blockData: { id: new Date().valueOf(), content: `${summary?.value || 'no summary'}\n${description?.value || ''}`, subscription: true },
          category: hasTime ? 'time' : 'allday',
          start: dtstart.value,
          end: dtend ? (hasTime ? dtend?.value : formatISO(parseISO(dtend?.value))) : undefined,
          calendarConfig: enabledCalendarList[index],
          defaultDuration,
          isAllDay: !hasTime,
        })
      }))
    } catch (error) {
      logseq.App.showMsg(`Parse Calendar ${enabledCalendarList[index].id} data error\n${error}`, 'error')
      console.log('[faiz:] === Parse Calendar error', error)
    }
  })

  return schedules
}

export const parseVCalendar = (data: any) => {
  function arrDataToObj(arr: any[]) {
    return arr.reduce((res, cur) => {
      return {
        ...res,
        [cur[0]]: {
          type: cur[2],
          value: cur[3],
        }
      }
    }, {})
  }
  const [calendarType, info, components] = data

  const events = components
                  .filter(component => component[0] === 'vevent')
                  .map(component => {
                    const [type, info, /*properties*/] = component
                    return arrDataToObj(info)
                  })

  return {
    type: calendarType,
    info: arrDataToObj(info),
    events,
  }

}

export const copyToClipboard = (text: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}