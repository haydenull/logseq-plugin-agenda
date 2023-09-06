import type { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import type { AppUserConfigs, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { endOfDay, formatISO, parse } from 'date-fns'
import dayjs, { type Dayjs } from 'dayjs'
import { flattenDeep, get, has } from 'lodash-es'
import type { ISchedule } from 'tui-calendar'

import { getInitialSettings } from './baseInfo'
import {
  CALENDAR_DONN_TASK_ALLDAY_STYLE,
  CALENDAR_DONN_TASK_TIME_STYLE,
  DEFAULT_BLOCK_DEADLINE_DATE_FORMAT,
  DEFAULT_JOURNAL_FORMAT,
  MARKDOWN_PROJECT_TIME_REG,
  ORG_PROJECT_TIME_REG,
  TIME_REG,
} from './constants'
import type { IEvent } from './events'
import { getBlockData, getPageData } from './logseq'
import { genTaskTimeLinkText } from './task'
import type { CalendarConfig, ICategory, IQueryWithCalendar, ISettingsForm } from './type'
import { parseUrlParams } from './util'

export const getCustomCalendarSchedules = async () => {
  // get calendar configs
  const settings = getInitialSettings()
  const { calendarList: calendarConfigs = [] } = settings
  const customCalendarConfigs = calendarConfigs.filter((config) => config?.enabled)

  let scheduleQueryList: IQueryWithCalendar[] = []

  scheduleQueryList = customCalendarConfigs
    .map((calendar) => {
      return calendar?.query
        ?.filter((item) => item?.script?.length)
        ?.map((item) => ({
          calendarConfig: calendar,
          query: item,
        }))
    })
    .filter(Boolean)
    .flat()

  const queryPromiseList = scheduleQueryList.map(async (queryWithCalendar) => {
    const { query } = queryWithCalendar
    const { script = '', queryType } = query
    let blocks: BlockEntity[] = []
    if (queryType === 'simple') {
      blocks = (await logseq.DB.q(script)) || []
    } else {
      blocks = await logseq.DB.datascriptQuery(script)
    }

    const buildSchedulePromiseList = flattenDeep(blocks).map((block) =>
      convertBlockToSchedule({ block, queryWithCalendar, settings }),
    )
    return Promise.all(buildSchedulePromiseList)
  })

  const scheduleRes = await Promise.allSettled(queryPromiseList)
  const scheduleResFulfilled: ISchedule[][] = []
  scheduleRes.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      scheduleResFulfilled.push(res.value?.filter(Boolean))
    } else {
      console.error('[faiz:] === scheduleRes error: ', scheduleQueryList[index], res)
      const { calendarConfig, query } = scheduleQueryList[index]
      const msg = `Query Exec Error:
calendar: ${calendarConfig.id}
query: ${query.script}
message: ${res.reason.message}`
      logseq.UI.showMsg(msg, 'error')
    }
  })
  return flattenDeep(scheduleResFulfilled)
}

export const getDailyLogSchedules = async () => {
  const { logKey, defaultDuration } = getInitialSettings()
  if (!logKey?.enabled) return []
  const logs = await logseq.DB.q(`[[${logKey.id}]]`)
  // logseq 0.8.0 modified the structure of the query return data
  // const _logs = logs
  //               ?.filter(block => {
  //                 if (block.headingLevel && block.format === 'markdown') {
  //                   block.content = block.content.replace(new RegExp(`^#{${block.headingLevel}} `), '')
  //                 }
  //                 return block.content?.trim() === `[[${logKey.id}]]`
  //               })
  //               ?.map(block => Array.isArray(block.parent) ? block.parent : [])
  //               ?.flat()
  //               ?.filter(block => {
  //                 const _content = block.content?.trim()
  //                 return _content.length > 0 && block?.page?.journalDay && !block.marker && !block.scheduled && !block.deadline
  //               }) || []
  const _logs =
    logs?.filter((block) => {
      // Interstitial Journal required filter task
      if (!block?.page?.journalDay) return false
      return TIME_REG.test(block?.content.replace(new RegExp(`^${block.marker} `), ''))
    }) || []
  const _logSchedulePromises = _logs?.map(async (block) => {
    const date = block?.page?.journalDay
    const { start: _startTime, end: _endTime } = getTimeInfo(
      block?.content.replace(new RegExp(`^${block.marker} `), ''),
    )
    const hasTime = _startTime || _endTime
    if (!hasTime) return undefined
    block.category = hasTime ? 'time' : 'allday'
    return await genSchedule({
      blockData: block,
      category: hasTime ? 'time' : 'allday',
      start: _startTime
        ? formatISO(parse(date + ' ' + _startTime, 'yyyyMMdd HH:mm', new Date()))
        : genCalendarDate(date),
      end: _endTime ? formatISO(parse(date + ' ' + _endTime, 'yyyyMMdd HH:mm', new Date())) : undefined,
      calendarConfig: logKey,
      defaultDuration,
      isAllDay: !hasTime,
      isReadOnly: true,
    })
  })
  const _logSchedules = await Promise.all(_logSchedulePromises)
  return _logSchedules.filter(Boolean)
}

export const convertBlockToSchedule = async ({
  block,
  queryWithCalendar,
  settings,
}: {
  block: BlockEntity
  queryWithCalendar: IQueryWithCalendar
  settings: ISettingsForm
}): Promise<ISchedule | null> => {
  const { calendarConfig, query } = queryWithCalendar
  const { scheduleStart = '', scheduleEnd = '', dateFormatter, isMilestone } = query
  const { defaultDuration } = settings
  const _dateFormatter = ['scheduled', 'deadline'].includes(scheduleStart || scheduleEnd)
    ? DEFAULT_BLOCK_DEADLINE_DATE_FORMAT
    : dateFormatter || DEFAULT_JOURNAL_FORMAT
  const start = get(block, scheduleStart, undefined)
  const end = get(block, scheduleEnd, undefined)
  let hasTime = /[Hhm]+/.test(_dateFormatter || '')

  let _start
  let _end
  try {
    _start = start && genCalendarDate(start, _dateFormatter)
    _end =
      end &&
      (hasTime ? genCalendarDate(end, _dateFormatter) : formatISO(endOfDay(parse(end, _dateFormatter, new Date()))))
  } catch (err) {
    console.warn('[faiz:] === parse calendar date error: ', err, block, query)
    return null
  }
  if (block?.page?.['journal-day']) {
    const { start: _startTime, end: _endTime } = getTimeInfo(
      block?.content.replace(new RegExp(`^${block.marker} `), ''),
    )
    if (_startTime || _endTime) {
      const date = block?.page?.['journal-day']
      ;(_start = _startTime
        ? formatISO(parse(date + ' ' + _startTime, 'yyyyMMdd HH:mm', new Date()))
        : genCalendarDate(date)),
        (_end = _endTime ? formatISO(parse(date + ' ' + _endTime, 'yyyyMMdd HH:mm', new Date())) : undefined),
        (hasTime = true)
    }
  }
  if (start && ['scheduled', 'deadline'].includes(scheduleStart)) {
    const dateString =
      block.content
        ?.split('\n')
        ?.find((l) => l.startsWith(`${scheduleStart.toUpperCase()}:`))
        ?.trim() ?? ''
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
    if (time) {
      _start = formatISO(parse(`${start} ${time}`, 'yyyyMMdd HH:mm', new Date()))
      hasTime = true
    }
  }
  if (end && ['scheduled', 'deadline'].includes(scheduleEnd)) {
    const dateString =
      block.content
        ?.split('\n')
        ?.find((l) => l.startsWith(`${scheduleEnd.toUpperCase()}:`))
        ?.trim() ?? ''
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
    if (time) {
      _end = formatISO(parse(`${end} ${time}`, 'yyyyMMdd HH:mm', new Date()))
      hasTime = true
    }
  }

  let _category: ICategory = hasTime ? 'time' : 'allday'
  if (isMilestone) _category = 'milestone'
  const rawCategory = _category
  const _isOverdue = isOverdue(block, _end || _start, !hasTime)
  if (!isMilestone && _isOverdue) _category = 'task'

  const schedule = await genSchedule({
    blockData: {
      ...block,
      // 避免 overdue 的 block 丢失真实 category 信息
      category: rawCategory,
      type: 'project',
      rawStart: _start,
      rawEnd: _end,
      rawAllDay: !hasTime,
      rawOverdue: _isOverdue,
    },
    category: _category,
    start: _start,
    end: _end,
    calendarConfig,
    defaultDuration,
    isAllDay: !isMilestone && !hasTime && !_isOverdue,
    isReadOnly: true,
  })
  return schedule
}

/**
 * 判断是否过期
 */
export const isOverdue = (block: BlockEntity, date: string, allDay: boolean) => {
  if (block.marker && block.marker !== 'DONE' && block.marker !== 'CANCELED' && block.marker !== 'WAITING') {
    if (allDay) {
      return dayjs().isAfter(dayjs(date), 'day')
    }
    return dayjs().isAfter(dayjs(date), 'minute')
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
  const res = content.match(TIME_REG)
  if (res) return { start: res[1], end: res[2]?.slice(1) }
  return { start: undefined, end: undefined }
}
/**
 * 修改时间信息
 */
export const modifyTimeInfo = (content: string, start: string, end: string) => {
  const timeInfo = `${start}${end ? '-' + end : ''}`
  const res = content.match(TIME_REG)
  if (res) return content.replace(TIME_REG, timeInfo)
  return timeInfo + ' ' + content
}
/**
 * 移除时间信息
 */
export const removeTimeInfo = (content: string) => {
  return content.replace(TIME_REG, '')
}

/**
 * 填充 block reference 内容
 */
export const fillBlockReference = async (blockContent: string) => {
  // eslint-disable-next-line no-useless-escape
  const BLOCK_REFERENCE_REG = /\(\([0-9a-z\-]{30,}\)\)/

  if (BLOCK_REFERENCE_REG.test(blockContent)) {
    const uuid = BLOCK_REFERENCE_REG.exec(blockContent)?.[0]?.replace('((', '')?.replace('))', '')
    if (uuid) {
      const referenceData = await getBlockData({ uuid }, true)
      return blockContent.replace(BLOCK_REFERENCE_REG, referenceData?.content || '')
    }
  }

  return blockContent
}

export async function genSchedule(params: {
  id?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockData: any
  category: ICategory
  start?: string
  end?: string
  calendarConfig: Omit<CalendarConfig, 'query'>
  isAllDay?: boolean
  isReadOnly?: boolean
  defaultDuration?: ISettingsForm['defaultDuration']
}): Promise<ISchedule> {
  const { id, blockData, category = 'time', start, end, calendarConfig, isAllDay, defaultDuration, isReadOnly } = params
  const uuid = typeof blockData?.uuid === 'string' ? blockData?.uuid : blockData?.uuid?.['$uuid$']
  if (!blockData?.id) {
    // 单个耗时在5-7秒，整体耗时8秒
    const block = await getBlockData({ uuid }, true)
    if (block) blockData.id = block.id
  }

  let page = blockData?.page
  if (has(page, 'id') && has(page, 'name') && has(page, 'original-name')) {
    page = {
      id: page.id,
      journalDay: page['journal-day'],
      journal: page['journal?'],
      name: page['name'],
      originalName: page['original-name'],
    }
  }
  // else {
  //   // 耗时1s左右
  //   page = await getPageData({ id: blockData?.page?.id })
  // }
  blockData.page = page

  // 单个耗时在5-7秒，整体耗时11秒
  blockData.fullContent = await fillBlockReference(blockData.content)

  const projectTimeReg =
    (window.logseqAppUserConfigs as AppUserConfigs)?.preferredFormat === 'org'
      ? ORG_PROJECT_TIME_REG
      : MARKDOWN_PROJECT_TIME_REG
  const title = blockData.fullContent
    .split('\n')[0]
    ?.replace(new RegExp(`^${blockData.marker} `), '')
    ?.replace(TIME_REG, '')
    ?.replace(projectTimeReg, '')
    ?.replace(' #milestone', '')
    ?.trim?.()
  const isDone = ['DONE', 'CANCELED'].includes(blockData.marker)

  function supportEdit() {
    if (blockData.page?.properties?.agenda === true) return true
    if (blockData?.page?.['journal-day'] && !blockData?.scheduled && !blockData?.deadline) return true
    return false
  }
  const isSupportEdit = isReadOnly === undefined ? supportEdit() : !isReadOnly

  const _defaultDuration = defaultDuration || getInitialSettings()?.defaultDuration
  let _end = end
  if ((category === 'time' || blockData?.category === 'time') && !end && start && _defaultDuration) {
    _end = dayjs(start)
      .add(_defaultDuration.value, _defaultDuration.unit as dayjs.ManipulateType)
      .format()
  }
  if (blockData?.category !== 'time' && !end) {
    _end = start
  }

  // const uuid = typeof blockData?.uuid === 'string' ? blockData?.uuid : blockData?.uuid?.['$uuid$']
  blockData.uuid = uuid
  const doneStyle = isAllDay ? CALENDAR_DONN_TASK_ALLDAY_STYLE : CALENDAR_DONN_TASK_TIME_STYLE
  return {
    id: id || uuid,
    calendarId: calendarConfig.id,
    // title: isDone ? `✅ ${title}` : title,
    title,
    body: blockData.fullContent,
    category,
    dueDateClass: '',
    start,
    end: _end,
    raw: blockData,
    color: calendarConfig?.textColor,
    bgColor: calendarConfig?.bgColor,
    borderColor: calendarConfig?.borderColor,
    isAllDay,
    customStyle: isDone ? doneStyle : '',
    isReadOnly: !isSupportEdit,
  }
}

export const genCalendarDate = (date: number | string, format = DEFAULT_BLOCK_DEADLINE_DATE_FORMAT) => {
  return formatISO(parse('' + date, format, new Date()))
}

export const genScheduleWithCalendarMap = (schedules: ISchedule[]) => {
  const res = new Map<string, ISchedule[]>()
  schedules.forEach((schedule) => {
    const key = schedule.calendarId || ''
    if (!res.has(key)) res.set(key, [])
    res.get(key)?.push(schedule)
  })
  return res
}

export const getAgendaCalendars = async () => {
  const { calendarList = [] } = logseq.settings as unknown as ISettingsForm
  const calendarPagePromises = calendarList.map((calendar) => getPageData({ originalName: calendar.id }))
  const res = await Promise.all(calendarPagePromises)
  return res
    .map((page, index) => {
      if (!page) return null
      if ((page as PageEntity)?.properties?.agenda !== true) return null
      return calendarList[index]
    })
    .filter(function <T>(item: T | null): item is T {
      return Boolean(item)
    })
}

export const supportEdit = (blockData, calendarId, agendaCalendarIds) => {
  if (agendaCalendarIds.includes(calendarId)) return true
  if (blockData?.page?.['journal-day'] && !blockData?.scheduled && !blockData?.deadline) return true
  return false
}

export const categorizeTask = (events: IEvent[] = []) => {
  return {
    waiting: events.filter((event) => event?.addOns?.status === 'waiting'),
    todo: events.filter((event) => event?.addOns?.status === 'todo'),
    doing: events.filter((event) => event?.addOns?.status === 'doing'),
    done: events.filter((event) => event?.addOns?.status === 'done'),
    canceled: events.filter((event) => event?.addOns?.status === 'canceled'),
  }
}

// 以开始时间为为key，转为map
export const scheduleStartDayMap = (events: IEvent[]) => {
  const res = new Map<string, IEvent[]>()
  events.forEach((event) => {
    const key = dayjs(event.addOns.start).startOf('day').format()
    if (!res.has(key)) res.set(key, [])
    res.get(key)?.push(event)
  })
  return res
}

export const getProjectTaskTime = (blockContent: string) => {
  const projectTimeReg =
    (window.logseqAppUserConfigs as AppUserConfigs)?.preferredFormat === 'org'
      ? ORG_PROJECT_TIME_REG
      : MARKDOWN_PROJECT_TIME_REG
  const res = blockContent.match(projectTimeReg)
  if (!res || !res?.[1]) return null
  return parseUrlParams(res[1])
}
export const deleteProjectTaskTime = (blockContent: string) => {
  const projectTimeReg =
    (window.logseqAppUserConfigs as AppUserConfigs)?.preferredFormat === 'org'
      ? ORG_PROJECT_TIME_REG
      : MARKDOWN_PROJECT_TIME_REG
  return blockContent.replace(projectTimeReg, '')
}
export const updateProjectTaskTime = (
  blockContent: string,
  timeInfo: { start: Dayjs; end: Dayjs; allDay?: boolean },
) => {
  const projectTimeReg =
    (window.logseqAppUserConfigs as AppUserConfigs)?.preferredFormat === 'org'
      ? ORG_PROJECT_TIME_REG
      : MARKDOWN_PROJECT_TIME_REG
  const time = genTaskTimeLinkText(timeInfo, (window.logseqAppUserConfigs as AppUserConfigs)?.preferredFormat)
  const newContent = removeTimeInfo(blockContent)?.trim()
  if (projectTimeReg.test(newContent)) {
    return newContent.replace(projectTimeReg, time)
  }
  return newContent
    ?.split('\n')
    .map((txt, index) => (index === 0 ? txt + ' ' + time : txt))
    .join('\n')
}

export function categorizeTasks(tasks: IEvent[]) {
  const overdueTasks: IEvent[] = []
  const allDayTasks: IEvent[] = []
  const timeTasks: IEvent[] = []
  tasks.forEach((task) => {
    if (task.addOns.isOverdue) {
      overdueTasks.push(task)
    } else if (task.addOns.allDay) {
      allDayTasks.push(task)
    } else {
      timeTasks.push(task)
    }
  })

  return { overdueTasks, allDayTasks, timeTasks }
}

export function categorizeSubscriptions(subscriptions: ISchedule[]) {
  const allDaySubscriptions: ISchedule[] = []
  const timeSubscriptions: ISchedule[] = []
  subscriptions.forEach((subscription) => {
    if (subscription.isAllDay) {
      allDaySubscriptions.push(subscription)
    } else {
      timeSubscriptions.push(subscription)
    }
  })

  return { allDaySubscriptions, timeSubscriptions }
}

export const judgeIsMilestone = (block: BlockEntity) => {
  return / #milestone/.test(block.content) || / #\[\[milestone\]\]/.test(block.content)
}
