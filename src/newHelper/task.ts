/* eslint-disable no-useless-escape */
import type { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import dayjs, { type Dayjs } from 'dayjs'

import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { KanBanItem } from '@/pages/NewDashboard/components/KanBan'
import type { RRule } from '@/types/fullcalendar'
import type { AgendaTask, AgendaTaskWithStart, AgendaTaskPage } from '@/types/task'
import { genDays } from '@/util/util'

import { parseAgendaDrawer } from './block'
import { transformPageToProject } from './project'

export type BlockFromQuery = BlockEntity & {
  marker: 'TODO' | 'DOING' | 'NOW' | 'LATER' | 'WAITING' | 'DONE' | 'CANCELED'
  deadline: number
  page: AgendaTaskPage
  repeated?: boolean
}
export const getAgendaTasks = async () => {
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
  `)) as BlockFromQuery[]
  if (!blocks || blocks?.length === 0) return []
  blocks = blocks.flat()
  const promiseList: Promise<AgendaTask[]>[] = blocks.map(async (block) => {
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

    const task = await transformBlockToAgendaTask(_block as unknown as BlockFromQuery)
    const recurringPastTasks: AgendaTask[] =
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
export const transformBlockToAgendaTask = async (block: BlockFromQuery): Promise<AgendaTask> => {
  const { uuid, marker, content, scheduled: scheduledNumber, deadline: deadlineNumber, properties, page } = block

  const title = content.split('\n')[0]?.replace(marker, '')?.trim()

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
    start = time ? dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm') : dayjs('' + scheduledNumber, 'YYYYMMDD')
  }

  // parse DEADLINE
  let deadline: Dayjs | undefined
  if (deadlineNumber) {
    const dateString = block.content
      ?.split('\n')
      ?.find((l) => l.startsWith(`DEADLINE:`))
      ?.trim()
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString!)?.[1] || null
    deadline = time ? dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm') : dayjs('' + scheduledNumber, 'YYYYMMDD')
  }

  // status
  const status = marker === 'DONE' ? 'done' : 'todo'

  const agendaDrawer = parseAgendaDrawer(block.content)
  // estimatedTime
  const estimatedTime = agendaDrawer && agendaDrawer.estimated ? agendaDrawer.estimated : undefined
  const _defaultEstimatedTime = DEFAULT_ESTIMATED_TIME
  // end
  const end = agendaDrawer?.end

  /**
   * parse logbook
   * "TODO Agenda new task design\n:LOGBOOK:\nCLOCK: [2023-09-16 Sat 15:35:51]--[2023-09-16 Sat 16:37:57]"
   * => [{ start: Dayjs, end: Dayjs, amount: 120 }]
   */
  let timeLogs =
    content
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
      .filter(Boolean) ?? []
  // 已完成任务，如果没有设置 timeLogs 则默认使用 estimatedTime
  if (start && status === 'done' && timeLogs?.length <= 0) {
    const finalEstimatedTime = estimatedTime ?? _defaultEstimatedTime
    timeLogs = [{ start, end: start.add(finalEstimatedTime, 'minute'), amount: finalEstimatedTime }]
  }

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

  return {
    id: uuid,
    status,
    title,
    start,
    end,
    allDay,
    deadline,
    estimatedTime,
    actualTime,
    project: transformPageToProject(page),
    timeLogs,
    // TODO: read from logseq
    // label: page,
    // repeat: ''
    subtasks: [],
    notes: [],
    rrule,
    doneHistory,
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
    const freqMap = {
      h: 'hourly',
      d: 'daily',
      w: 'weekly',
      m: 'monthly',
      y: 'yearly',
    }
    const rruleReg = /[.+]*\+(\d+)([hdwmy])/
    const res = freq.match(rruleReg)
    if (!res) return null
    return {
      freq: freqMap[res[2]],
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
 * splitting multi-days task into single-day tasks
 */
export const transformTasksToKanbanTasks = (tasks: AgendaTaskWithStart[]): KanBanItem[] => {
  const today = dayjs()
  return tasks
    .map((task) => {
      const { allDay, end, start } = task
      if (allDay && end) {
        const days = genDays(start, end)
        return days.map((day) => {
          const isPast = day.isBefore(today, 'day')
          const isEndDay = day.isSame(end, 'day')
          return {
            ...task,
            start: day,
            filtered: true,
            // 过去且不是结束日期的任务默认为已完成
            status: (isPast && !isEndDay) || task.status === 'done' ? 'done' : 'todo',
          } as KanBanItem
        })
      }
      return {
        ...task,
        filtered: task.recurringPast || Boolean(task.rrule),
      }
    })
    .flat()
}

/**
 * categorize task according to project name
 */
export const categorizeTasksByPage = (tasks: AgendaTask[]) => {
  const categorizedTasks: Record<string, AgendaTask[]> = {}
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
