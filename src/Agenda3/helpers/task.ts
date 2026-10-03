/* eslint-disable no-useless-escape */
import type { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import dayjs, { type Dayjs } from 'dayjs'
import { RRule as RRuleClass } from 'rrule'

import type { KanBanItem } from '@/Agenda3/components/kanban/KanBan'
import type { Filter, Settings } from '@/Agenda3/models/settings'
import { DEFAULT_ESTIMATED_TIME, getRecentDaysRange } from '@/constants/agenda'
import type { AgendaEntity, AgendaEntityDeadline, AgendaEntityPage } from '@/types/entity'
import type { RRule } from '@/types/fullcalendar'
import type { AgendaTaskWithStart, AgendaTaskWithStartOrDeadline } from '@/types/task'
import { genDays } from '@/util/util'

import { parseAgendaDrawer } from './block'
import { getDbDateValue, getDbScalarValue, getDbTaskStatus, isCanceledDbStatus, isCompletedDbStatus } from './dbGraph'
import { transformPageToProject } from './project'

export const FREQ_ENUM_MAP = {
  hourly: RRuleClass.HOURLY,
  daily: RRuleClass.DAILY,
  weekly: RRuleClass.WEEKLY,
  monthly: RRuleClass.MONTHLY,
  yearly: RRuleClass.YEARLY,
} as const
const FREQ_MAP = {
  h: 'hourly',
  d: 'daily',
  w: 'weekly',
  m: 'monthly',
  y: 'yearly',
} as const

export type BlockFromQuery = BlockEntity & {
  marker: 'TODO' | 'DOING' | 'NOW' | 'LATER' | 'WAITING' | 'DONE' | 'CANCELED'
  deadline?: number
  page: AgendaEntityPage
  repeated?: boolean
}
export type BlockFromQueryWithFilters = BlockFromQuery & {
  filters?: Filter[]
}

async function transformDbTask(block: BlockEntity, settings: Settings): Promise<AgendaEntity | null> {
  const [page, properties] = await Promise.all([
    logseq.Editor.getPage(block.page.id),
    logseq.Editor.getBlockProperties(block.uuid),
  ])
  if (!page) throw new Error(`Logseq DB task page not found: ${block.uuid}`)
  const status = getDbTaskStatus(properties)
  if (status && isCanceledDbStatus(status)) return null

  const start = getDbDateValue(properties, 'logseq.property/scheduled')
  const deadline = getDbDateValue(properties, 'logseq.property/deadline')
  const marker = status && isCompletedDbStatus(status) ? 'DONE' : 'TODO'
  const title = block.title ?? block.content ?? ''
  const formatScheduled = (date: typeof start) =>
    date?.format(date.hour() || date.minute() ? 'YYYY-MM-DD ddd HH:mm' : 'YYYY-MM-DD ddd')
  const content = [
    `${marker} ${title}`,
    start ? `SCHEDULED: <${formatScheduled(start)}>` : undefined,
    deadline ? `DEADLINE: <${formatScheduled(deadline)}>` : undefined,
  ]
    .filter(Boolean)
    .join('\n')
  const pageName = page.originalName ?? page.title ?? page.name
  const agendaBlock: BlockFromQuery = {
    ...block,
    content,
    marker,
    scheduled: start ? Number(start.format('YYYYMMDD')) : undefined,
    deadline: deadline ? Number(deadline.format('YYYYMMDD')) : undefined,
    page: {
      id: page.id,
      uuid: page.uuid,
      originalName: pageName,
      isJournal: Boolean(page['journal?']),
      journalDay: page.journalDay,
      properties: page.properties,
    },
  }
  const entity = await transformBlockToAgendaEntity(agendaBlock, { ...settings, selectedFilters: [] })
  const startAllDay = getDbScalarValue(properties, 'agenda3_start_all_day')
  const deadlineAllDay = getDbScalarValue(properties, 'agenda3_deadline_all_day')
  const estimatedTime = getDbScalarValue(properties, 'agenda3_estimated_time')
  return {
    ...entity,
    allDay: typeof startAllDay === 'boolean' ? startAllDay : entity.allDay,
    end: getDbDateValue(properties, 'agenda3_end_date'),
    estimatedTime: typeof estimatedTime === 'number' ? estimatedTime : undefined,
    deadline: entity.deadline
      ? {
          ...entity.deadline,
          allDay: typeof deadlineAllDay === 'boolean' ? deadlineAllDay : entity.deadline.allDay,
        }
      : undefined,
  }
}

export async function getDbAgendaEntity(uuid: string, settings: Settings) {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return null
  return transformDbTask(block, settings)
}

export const getAgendaEntities = async (settings: Settings) => {
  const taskTag = (await logseq.Editor.getTag('logseq.class/Task')) ?? (await logseq.Editor.getTag('Task'))
  if (!taskTag) throw new Error('Logseq DB Task tag is unavailable')

  const rows = await logseq.DB.datascriptQuery<Array<[string]>>(
    `[:find ?uuid :in $ ?tag :where [?block :block/tags ?tag] [?block :block/uuid ?uuid]]`,
    taskTag.id,
  )
  if (!rows?.length) return []
  const tasks: (AgendaEntity | null)[] = await Promise.all(
    (rows ?? []).map(async ([uuid]) => {
      const block = await logseq.Editor.getBlock(uuid)
      if (!block) return null
      return transformDbTask(block, settings)
    }),
  )
  return tasks.filter((task): task is AgendaEntity => task !== null)
}

/**
 * transform logseq block to agenda task
 */
export const transformBlockToAgendaEntity = async (
  block: BlockFromQuery,
  settings: Settings,
  favoritePages?: string[],
): Promise<AgendaEntity> => {
  const favorites = favoritePages ?? (await logseq.App.getCurrentGraphFavorites()) ?? []
  const _favoritePages = favorites.map((favorite) =>
    typeof favorite === 'string' ? favorite : favorite.originalName ?? favorite.title ?? favorite.name,
  )
  const { general = {} } = settings
  const { uuid, marker, scheduled: scheduledNumber, deadline: deadlineNumber, properties, page, format } = block
  const content = block.content ?? block.title

  const title = content.split('\n')[0]?.replace(marker, '')?.trim() ?? ''
  const showTitle = await formatTaskTitle(title, format)

  let allDay = true
  // parse SCHEDULED
  let start: Dayjs | undefined
  if (scheduledNumber) {
    const dateString = block.content
      ?.split('\n')
      ?.find((l) => l.startsWith(`SCHEDULED:`))
      ?.trim()
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString!)?.[1] || null
    if (time) allDay = false
    start = time ? dayjs(`${scheduledNumber} ${time}`, 'YYYYMMDD HH:mm') : dayjs('' + scheduledNumber, 'YYYYMMDD')
  } else if (page.isJournal && general?.useJournalDayAsSchedule) {
    start = dayjs(String(page.journalDay), 'YYYYMMDD')
  }

  // parse DEADLINE
  let deadline: AgendaEntityDeadline | undefined
  if (deadlineNumber) {
    const dateString = block.content
      ?.split('\n')
      ?.find((l) => l.startsWith(`DEADLINE:`))
      ?.trim()
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString!)?.[1] || null
    deadline = {
      value: time ? dayjs(`${deadlineNumber} ${time}`, 'YYYYMMDD HH:mm') : dayjs('' + deadlineNumber, 'YYYYMMDD'),
      allDay: !time,
    }
  }

  // status
  const status = marker === 'DONE' ? 'done' : 'todo'

  const agendaDrawer = parseAgendaDrawer(block.content ?? '')
  // estimatedTime
  const estimatedTime = agendaDrawer && agendaDrawer.estimated ? agendaDrawer.estimated : undefined
  const _defaultEstimatedTime = DEFAULT_ESTIMATED_TIME
  // end
  const end = agendaDrawer?.end
  // objective
  const objective = agendaDrawer?.objective
  // bindObjectiveId
  const bindObjectiveId = agendaDrawer?.bindObjectiveId

  /**
   * parse logbook
   * "TODO Agenda new task design\n:LOGBOOK:\nCLOCK: [2023-09-16 Sat 15:35:51]--[2023-09-16 Sat 16:37:57]"
   * => [{ start: Dayjs, end: Dayjs, amount: 120 }]
   */
  const timeLogs = content
    .split('\n')
    .filter((l) => l.startsWith('CLOCK: ['))
    .map((item) => {
      // item: CLOCK: [2023-09-16 Sat 15:35:51]--[2023-09-16 Sat 16:37:57] -> [2023-09-1615:35:51, 2023-09-1616:37:57]
      const [startText, endText] = item.replace(/[a-zA-Z\s\[\]]/g, '').split('--')
      if (!startText || !endText) return null
      const start = dayjs(startText, 'YYYY-MM-DDHH:mm:ss')
      const end = dayjs(endText, 'YYYY-MM-DDHH:mm:ss')
      return { start, end, amount: end.diff(start, 'minute') }
    })
    .filter(Boolean)
  // 已完成任务，如果没有设置 timeLogs 则默认使用 estimatedTime
  // if (start && status === 'done' && timeLogs?.length <= 0) {
  //   const finalEstimatedTime = estimatedTime ?? _defaultEstimatedTime
  //   timeLogs = [{ start, end: start.add(finalEstimatedTime, 'minute'), amount: finalEstimatedTime }]
  // }

  /**
   * parse done history
   * "TODO Agenda new task design\n:LOGBOOK:\n* State "DONE" from "TODO" [2023-10-09 Mon 08:16]\n:END:"
   * => Dayjs[]
   */
  const doneHistory = content
    .split('\n')
    .filter((l) => l.startsWith('* State "DONE" from '))
    .map((item) => {
      const datetimeString = item.replace(/[a-zA-Z\s\[\]*"]/g, '')
      return dayjs(datetimeString, 'YYYY-MM-DDHH:mm')
    })

  // actual time
  const actualTime = timeLogs?.length > 0 ? timeLogs.reduce((acc, timeLog) => acc + timeLog.amount, 0) : undefined

  // recurring info from scheduled
  let rrule: RRule | undefined
  if (block.repeated && scheduledNumber) {
    const scheduledString =
      block.content
        ?.split('\n')
        ?.find((l) => l.startsWith(`SCHEDULED:`))
        ?.trim() ?? ''
    const _rrule = parseRRule(scheduledString)
    if (_rrule) rrule = _rrule
  }

  // filters
  let _filters: Filter[] = (block as BlockFromQueryWithFilters).filters ?? []
  if (settings.selectedFilters?.length && !_filters.length) {
    const settingsFilters = settings.filters?.filter((_filter) => settings.selectedFilters?.includes(_filter.id)) ?? []
    const filterBlocks = await retrieveFilteredBlocks(settingsFilters)
    const belongFilters = filterBlocks
      .filter((filterBlock) => filterBlock.uuid === block.uuid)
      .map((filterBlock) => filterBlock.filter)
    _filters = belongFilters
  }

  return {
    id: uuid,
    status,
    title,
    showTitle,
    start,
    end,
    allDay,
    deadline,
    estimatedTime,
    actualTime,
    project: transformPageToProject(page, _favoritePages),
    filters: _filters,
    timeLogs,
    // TODO: read from logseq
    // label: page,
    // repeat: ''
    subtasks: [],
    notes: [],
    rrule,
    doneHistory,
    objective,
    bindObjectiveId,
    rawBlock: block,
  }
}

/**
 * parse recurring rules
 * SCHEDULED: <2023-10-10 Tue ++1d> -> { freq: 'daily', interval: 1, dtstart: '2023-10-10' }
 * SCHEDULED: <2023-10-10 Tue .+1d> -> { freq: 'daily', interval: 1, dtstart: '2023-10-10' }
 * SCHEDULED: <2023-10-10 Tue +1d> ->  { freq: 'daily', interval: 1, dtstart: '2023-10-10' }
 * SCHEDULED: <2023-10-10 Tue 10:00 +1d> ->  { freq: 'daily', interval: 1, dtstart: '2023-10-10T10:00:00' }
 */
function parseRRule(input: string): RRule | null {
  const cleanedInput = input.replace('SCHEDULED:', '').replace('<', '').replace('>', '').trim()
  const parts = cleanedInput.split(' ')

  function parseFreq(freq: string) {
    const rruleReg = /[.+]*\+(\d+)([hdwmy])/
    const res = freq.match(rruleReg)
    if (!res) return null
    return {
      freq: FREQ_MAP[res[2]],
      interval: Number(res[1]),
    }
  }

  if (parts.length === 4) {
    const start = dayjs(parts[0] + ' ' + parts[2], 'YYYY-MM-DD HH:mm')
    const res = parseFreq(parts[3])
    if (!res) return null
    return {
      freq: res.freq,
      interval: res.interval,
      dtstart: start.format(),
    }
  } else if (parts.length === 3) {
    const res = parseFreq(parts[2])
    if (!res) return null
    return {
      freq: res.freq,
      interval: res.interval,
      dtstart: parts[0],
    }
  }
  return null
}

export const DATE_FORMATTER_FOR_KEY = 'YYYYMMDD'
/**
 * separate tasks day by day
 */
export const separateTasksInDay = (
  tasks: AgendaTaskWithStartOrDeadline[],
): Map<string, AgendaTaskWithStartOrDeadline[]> => {
  // separate tasks in day based on scheduled date
  const tasksMap = new Map<string, AgendaTaskWithStartOrDeadline[]>()
  tasks.forEach((task) => {
    if (!task.start && !task.deadline?.value) return
    const taskDayStr = task.start
      ? task.start.format(DATE_FORMATTER_FOR_KEY)
      : task.deadline!.value.format(DATE_FORMATTER_FOR_KEY)
    if (tasksMap.has(taskDayStr)) {
      tasksMap.get(taskDayStr)?.push(task)
    } else {
      tasksMap.set(taskDayStr, [task])
    }
  })
  const arr = Array.from(tasksMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([day, tasks]) => [day, tasks] as const)
  return new Map(arr)
}

/**
 * adapt task to kanban
 */
export const transformTasksToKanbanTasks = (
  tasks: AgendaTaskWithStartOrDeadline[],
  options: { showFirstEventInCycleOnly?: boolean } = {},
): KanBanItem[] => {
  const { showFirstEventInCycleOnly = false } = options
  const today = dayjs()
  return tasks
    .map((task) => {
      const { allDay, end, start } = task

      // splitting multi-days task into single-day tasks
      if (allDay && end && start) {
        const days = genDays(start, end)
        return days.map((day) => {
          const isPast = day.isBefore(today, 'day')
          const isEndDay = day.isSame(end, 'day')
          return {
            ...task,
            start: day,
            // filtered: true,
            // 过去且不是结束日期的任务默认为已完成
            status: (isPast && !isEndDay) || task.status === 'done' ? 'done' : 'todo',
          } as KanBanItem
        })
      }

      // show recurring task
      if (task.rrule) {
        const rruleInstance = getRRuleInstance(showFirstEventInCycleOnly ? { ...task.rrule, count: 1 } : task.rrule)
        const [startDay, endDay] = getRecentDaysRange()
        const dates = rruleInstance.between(startDay.toDate(), endDay.add(1, 'day').toDate())
        return dates.map((date) => {
          return {
            ...task,
            start: dayjs(date),
          }
        })
      }

      return task
      // return {
      //   ...task,
      //   filtered: task.recurringPast || Boolean(task.rrule),
      // }
    })
    .flat()
}

export function getRRuleInstance(rrule: RRule) {
  return new RRuleClass({
    ...rrule,
    freq: FREQ_ENUM_MAP[rrule.freq],
    dtstart: dayjs(rrule.dtstart).toDate(),
  })
}

/**
 * categorize task according to project name
 */
export const categorizeTasksByPage = (tasks: AgendaEntity[]) => {
  const categorizedTasks: Record<string, AgendaEntity[]> = {}
  tasks.forEach((task) => {
    const { originalName: projectName } = task.project
    if (!categorizedTasks[projectName]) {
      categorizedTasks[projectName] = []
    }
    categorizedTasks[projectName].push(task)
  })
  return Object.values(categorizedTasks).map((projectTasks) => {
    return {
      project: projectTasks[0].project,
      tasks: projectTasks,
    }
  })
}

function replaceLinks(text: string, format: 'org' | 'markdown' = 'markdown') {
  if (format === 'org') {
    const orgRegex = /\[\[([^\]]+)\]\[([^\]]+)\]\]/g
    return text.replace(orgRegex, (match, link, title) => title)
  }
  const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  return text.replace(markdownRegex, (match, title, link) => title)
}
/**
 * replace page reference
 * [[test]] -> test
 */
function replacePageReference(text: string) {
  const pageReferenceRegex = /\[\[([^\]]+)\]\]/g
  return text.replace(pageReferenceRegex, (match, title) => title)
}

/**
 * replace block reference
 * ((some-id-id)) -> block reference
 */
async function replaceBlockReference(text: string): Promise<string> {
  const referenceRegex = /\(\(([\w-]+)\)\)|\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/gi
  const references = Array.from(text.matchAll(referenceRegex), (match) => ({
    text: match[0],
    uuid: match[1] ?? match[2],
  }))
  const uniqueUuids = [...new Set(references.map(({ uuid }) => uuid))]
  const resolvedTitles = await Promise.all(
    uniqueUuids.map(async (uuid) => {
      const block = await logseq.Editor.getBlock(uuid)
      const blockTitle = block?.title ?? block?.content
      if (blockTitle) return [uuid, blockTitle.split('\n')[0]] as const

      const page = await logseq.Editor.getPage(uuid)
      const pageTitle = page?.originalName ?? page?.title ?? page?.name
      return pageTitle ? ([uuid, pageTitle] as const) : null
    }),
  )
  const titles = new Map(resolvedTitles.filter((entry): entry is readonly [string, string] => entry !== null))
  references.forEach(({ text: reference, uuid }) => {
    const title = titles.get(uuid)
    if (title) text = text.replace(reference, title)
  })
  return text
}

/**
 * format title
 * 1. link [title](link) or [[link][title]] -> title
 * 2. page reference [[test]] -> test
 * 3. block reference ((sdfash-sdfa-ss)) -> test
 */
export const formatTaskTitle = async (title: string, format: BlockEntity['format']) => {
  return replaceLinks(replacePageReference(await replaceBlockReference(title)), format)

  // return await fillBlockReference(task.title)
}

export const execQuery = async (query: string): Promise<BlockEntity[] | null> => {
  if (query.startsWith('(')) {
    return logseq.DB.q(query)
  }
  return logseq.DB.datascriptQuery(query)
}

type BlockEntityWithFilter = BlockEntity & {
  filter: Filter
}
export const retrieveFilteredBlocks = async (filters: Filter[]): Promise<BlockEntityWithFilter[]> => {
  const list = filters.map(async (filter) => {
    const blocks = await execQuery(filter.query)
    return blocks?.flat(Infinity)?.map((block) => ({
      ...block,
      filter,
    }))
  })
  const result = await Promise.all(list)
  return result.flat(Infinity).filter(Boolean) as BlockEntityWithFilter[]
}
