/* eslint-disable no-useless-escape */
import type { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import dayjs, { type Dayjs } from 'dayjs'
import { RRule as RRuleClass } from 'rrule'

import type { KanBanItem } from '@/Agenda3/components/kanban/KanBan'
import type { Filter, Settings } from '@/Agenda3/models/settings'
import { DEFAULT_ESTIMATED_TIME, getRecentDaysRange } from '@/constants/agenda'
import type { AgendaEntity, AgendaEntityDeadline, AgendaEntityPage } from '@/types/entity'
import type { RRule } from '@/types/fullcalendar'
import type { AgendaTaskWithStart } from '@/types/task'
import { fillBlockReference } from '@/util/schedule'
import { genDays } from '@/util/util'

import { parseAgendaDrawer } from './block'
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
export const getAgendaEntities = async (settings: Settings) => {
  const favoritePages = (await logseq.App.getCurrentGraphFavorites()) || []
  let blocks = (await logseq.DB.datascriptQuery(`
  [:find (pull
    ?block
    [:block/uuid
      :block/parent
      :db/id
      :block/left
      :block/collapsed?
      :block/format
      :block/_refs
      :block/path-refs
      :block/tags
      :block/content
      :block/marker
      :block/priority
      :block/properties
      :block/properties-order
      :block/properties-text-values
      :block/pre-block?
      :block/scheduled
      :block/deadline
      :block/repeated?
      :block/created-at
      :block/updated-at
      :block/file
      :block/heading-level
      {:block/page
        [:db/id :block/uuid :block/name :block/original-name :block/journal-day :block/journal? :block/properties]}
      {:block/refs
        [:db/id :block/uuid :block/name :block/original-name :block/journal-day :block/journal? :block/properties]}])
    :where
    [?block :block/marker ?marker]
    [(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
  `)) as BlockFromQueryWithFilters[]
  if (!blocks || blocks?.length === 0) return []
  blocks = blocks.flat()

  const filters = settings.filters?.filter((_filter) => settings.selectedFilters?.includes(_filter.id)) ?? []

  if (settings.selectedFilters?.length) {
    const filterBlocks = await retrieveFilteredBlocks(filters)
    const filterBlockIds = filterBlocks.map((block) => block.uuid)
    blocks = blocks
      .filter((block) => filterBlockIds.includes(block.uuid))
      .map((block) => {
        return {
          ...block,
          filters: filterBlocks
            .filter((filterBlock) => filterBlock.uuid === block.uuid)
            .map((filterBlock) => filterBlock.filter),
        }
      })
  }
  const promiseList: Promise<AgendaEntity[]>[] = blocks.map(async (block) => {
    const _block = {
      ...block,
      uuid: typeof block.uuid === 'string' ? block.uuid : block.uuid?.['$uuid$'],
      repeated: block['repeated?'],
      page: {
        ...block.page,
        uuid: block.page?.['uuid'],
        originalName: block.page?.['original-name'],
        journalDay: block.page?.['journal-day'],
        isJournal: block.page?.['journal?'],
        properties: block.page?.['properties'],
      },
      refs: block.refs?.map((_page) => ({
        ..._page,
        uuid: _page?.['uuid'],
        journalDay: _page?.['journal-day'],
        originalName: _page?.['original-name'],
        isJournal: _page?.['journal?'],
        properties: _page?.['properties'],
      })),
    }

    const task = await transformBlockToAgendaEntity(_block as unknown as BlockFromQuery, settings, favoritePages)
    const recurringPastTasks: AgendaEntity[] =
      task.doneHistory?.map((pastTaskEnd) => {
        const { estimatedTime = DEFAULT_ESTIMATED_TIME } = task
        const spanTime = task.status === 'done' && task.actualTime ? task.actualTime : estimatedTime
        return {
          ...task,
          id: task.id + '_' + pastTaskEnd.format('YYYYMMDDHHmm'),
          start: pastTaskEnd.subtract(spanTime, 'minute'),
          recurringPast: true,
          rrule: undefined,
          repeated: false,
          status: 'done',
          actualTime: task.estimatedTime,
        }
      }) ?? []
    return [task].concat(recurringPastTasks)
  })

  const tasks = await Promise.all(promiseList)
  return tasks.flat()
}

/**
 * transform logseq block to agenda task
 */
export const transformBlockToAgendaEntity = async (
  block: BlockFromQuery,
  settings: Settings,
  favoritePages?: string[],
): Promise<AgendaEntity> => {
  const _favoritePages = (favoritePages ?? (await logseq.App.getCurrentGraphFavorites())) || []
  const { general = {} } = settings
  const {
    uuid,
    marker,
    content,
    scheduled: scheduledNumber,
    deadline: deadlineNumber,
    properties,
    page,
    filters,
    format,
  } = block

  const title = content.split('\n')[0]?.replace(marker, '')?.trim()
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

  const agendaDrawer = parseAgendaDrawer(block.content)
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
  let _filters: Filter[] = filters ?? []
  if (settings.selectedFilters?.length && !filters?.length) {
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
export const separateTasksInDay = (tasks: AgendaTaskWithStart[]): Map<string, AgendaTaskWithStart[]> => {
  // separate tasks in day based on scheduled date
  const tasksMap = new Map<string, AgendaTaskWithStart[]>()
  tasks.forEach((task) => {
    const taskDayStr = task.start.format(DATE_FORMATTER_FOR_KEY)
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
  tasks: AgendaTaskWithStart[],
  options: { showFirstEventInCycleOnly?: boolean } = {},
): KanBanItem[] => {
  const { showFirstEventInCycleOnly = false } = options
  const today = dayjs()
  return tasks
    .map((task) => {
      const { allDay, end, start } = task

      // splitting multi-days task into single-day tasks
      if (allDay && end) {
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
  const blockIds = Array.from(text.matchAll(/\(\(([\w-]+)\)\)/g)).map((match) => match[1])
  const blocks = await Promise.all(
    blockIds.map((uuid) => {
      // if not a valid uuid, return null
      if (!uuid.match(/^[\w-]{31,}$/)) return null
      return logseq.Editor.getBlock(uuid)
    }),
  )
  blocks.forEach((block, index) => {
    if (block?.content) {
      const firstLine = block.content.split('\n')[0]
      text = text.replace(`((${blockIds[index]}))`, firstLine)
    }
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
