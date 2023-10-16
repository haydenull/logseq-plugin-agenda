import { message } from 'antd'
import { format } from 'date-fns'
import dayjs, { type Dayjs } from 'dayjs'

import {
  AGENDA_DRAWER_REGEX,
  DATE_FORMATTER,
  LOGBOOK_CLOCK_FORMATTER,
  LOGBOOK_REGEX,
  SCHEDULED_DATETIME_FORMATTER,
  SCHEDULED_DATE_FORMATTER,
} from '@/constants/agenda'
import type { AgendaTask, CreateAgendaTask } from '@/types/task'
import { updateBlock } from '@/util/logseq'

import { secondsToHHmmss } from './fullCalendar'

/**
 * change task date and estimated time
 */
export const updateDateInfo = async ({
  uuid,
  allDay,
  start,
  end,
  estimatedTime,
}: {
  uuid: string
  allDay: boolean
  start: Dayjs
  end?: Dayjs
  estimatedTime?: number
}) => {
  const originalBlock = await logseq.Editor.getBlock(uuid)
  if (!originalBlock) return Promise.reject(new Error('Block not found'))

  const scheduledText = `SCHEDULED: <${start.format(allDay ? SCHEDULED_DATE_FORMATTER : SCHEDULED_DATETIME_FORMATTER)}>`
  // update SCHEDULED
  const newContent = originalBlock.scheduled
    ? originalBlock.content
        .split('\n')
        .map((line) => {
          if (line.startsWith('SCHEDULED:')) return scheduledText
          return line
        })
        .join('\n')
    : `${originalBlock.content}\n${scheduledText}`
  // update estimated time and end date
  const newContent2 = updateAgendaDrawer(newContent, {
    estimated: estimatedTime,
    end,
  })
  return logseq.Editor.updateBlock(uuid, newContent2)
}

/**
 * update task time log
 */
export const updateTimeLog = async (
  uuid: string,
  info: {
    start: Dayjs
    end: Dayjs
    index: number
  },
) => {
  const originalBlock = await logseq.Editor.getBlock(uuid)
  if (!originalBlock) return Promise.reject(new Error('Block not found'))

  const timeLogTexts = originalBlock.content
    .split('\n')
    .filter((line) => line.startsWith('CLOCK: ['))
    .map((log, i) => {
      if (i === info.index) {
        // CLOCK: [2023-09-16 Sat 15:35:51]--[2023-09-16 Sat 16:37:57] =>  01:02:06
        return `CLOCK: [${info.start.format(LOGBOOK_CLOCK_FORMATTER)}]--[${info.end.format(
          LOGBOOK_CLOCK_FORMATTER,
        )}] =>  ${secondsToHHmmss(info.end.diff(info.start, 'second'))}`
      }
      return log
    })
  const newContent = originalBlock.content
    .split('\n')
    .filter((line) => !(line.startsWith('CLOCK: [') || line.startsWith(':LOGBOOK:') || line.startsWith(':END:')))
    .filter(Boolean)
    .concat(':LOGBOOK:')
    .concat(timeLogTexts)
    .concat(':END:')
    .join('\n')
  return logseq.Editor.updateBlock(uuid, newContent)
}

/**
 * add task time log
 */
export const addTimeLog = async (
  uuid: string,
  info: {
    start: Dayjs
    end: Dayjs
  },
) => {
  const originalBlock = await logseq.Editor.getBlock(uuid)
  if (!originalBlock) return Promise.reject(new Error('Block not found'))

  const timeLogTexts = (originalBlock.content.split('\n').filter((line) => line.startsWith('CLOCK: [')) || []).concat(
    `CLOCK: [${info.start.format(LOGBOOK_CLOCK_FORMATTER)}]--[${info.end.format(
      LOGBOOK_CLOCK_FORMATTER,
    )}] =>  ${secondsToHHmmss(info.end.diff(info.start, 'second'))}`,
  )
  const newContent = originalBlock.content
    .split('\n')
    .filter((line) => !(line.startsWith('CLOCK: [') || line.startsWith(':LOGBOOK:') || line.startsWith(':END:')))
    .filter(Boolean)
    .concat(':LOGBOOK:')
    .concat(timeLogTexts)
    .concat(':END:')
    .join('\n')
  return logseq.Editor.updateBlock(uuid, newContent)
}

/**
 * delete task time log
 */
export const deleteTimeLog = async (uuid: string, index: number) => {
  const originalBlock = await logseq.Editor.getBlock(uuid)
  if (!originalBlock) return Promise.reject(new Error('Block not found'))

  const timeLogTexts = originalBlock.content
    .split('\n')
    .filter((line) => line.startsWith('CLOCK: ['))
    .filter((log, i) => i !== index)
  const newContent = originalBlock.content
    .split('\n')
    .filter((line) => !(line.startsWith('CLOCK: [') || line.startsWith(':LOGBOOK:') || line.startsWith(':END:')))
    .filter(Boolean)
    .concat(':LOGBOOK:')
    .concat(timeLogTexts)
    .concat(':END:')
    .join('\n')
  return logseq.Editor.updateBlock(uuid, newContent)
}

/**
 * create task
 */
export const createTask = async (taskInfo: CreateAgendaTask) => {
  const { title, allDay, start, end, estimatedTime } = taskInfo

  const AGENDA_DRAWER = genAgendaDrawerText({
    estimated: estimatedTime,
    end,
  })
  // const
  const content = [
    `TODO ${title}`,
    `SCHEDULED: <${start.format(allDay ? SCHEDULED_DATE_FORMATTER : SCHEDULED_DATETIME_FORMATTER)}>`,
    AGENDA_DRAWER,
  ]
    .filter(Boolean)
    .join('\n')

  // create journal page
  const { preferredDateFormat } = await logseq.App.getUserConfigs()
  const journalName = format(dayjs().valueOf(), preferredDateFormat)
  const journalPage = await logseq.Editor.createPage(journalName, {}, { journal: true })

  if (!journalPage) return Promise.reject(new Error('Failed to create journal page'))

  return logseq.Editor.insertBlock(journalPage.originalName, content, {
    isPageBlock: true,
    sibling: true,
  })
}

export function generateTimeLogText({ start, end }: { start: Dayjs; end: Dayjs }) {
  return `CLOCK: [${start.format(LOGBOOK_CLOCK_FORMATTER)}]--[${end.format(
    LOGBOOK_CLOCK_FORMATTER,
  )}] =>  ${secondsToHHmmss(end.diff(start, 'second'))}`
}
// function generateTimeLogsText(timeLogs?: { start: Dayjs; end: Dayjs }[]) {
//   if (!Array.isArray(timeLogs)) return ''
//   // 若返回为空，则不会更新原有的 logbook
//   if (timeLogs.length === 0) return [':LOGBOOK:', ':END:'].join('\n')
//   return [':LOGBOOK:', ...timeLogs.map(generateTimeLogText), ':END:'].join('\n')
// }

/**
 * update task
 */
export const updateTask = async (taskInfo: AgendaTask) => {
  const { id, title, allDay, start, end, estimatedTime, status, timeLogs } = taskInfo
  const originalBlock = await logseq.Editor.getBlock(id)
  if (!originalBlock) return Promise.reject(new Error('Block not found'))

  const content1 = updateTitle(originalBlock.content, title, status)
  const content2 = updateScheduled(content1, { start, allDay })
  const content3 = updateAgendaDrawer(content2, { estimated: estimatedTime, end })
  const content4 = updateTimeLogText(content3, timeLogs)

  return await updateBlock(id, content4)
}

/**
 * toggle task status
 */
export const updateTaskStatus = async (taskInfo: AgendaTask, status: AgendaTask['status']) => {
  const todoTag = status === 'done' ? 'DONE' : 'TODO'
  const rawTodoTag = taskInfo.rawBlock.marker
  if (!rawTodoTag) return message.error('This is not a todo block')
  const reg = new RegExp(`^${rawTodoTag}`)
  const newContent = taskInfo.rawBlock.content.replace(reg, todoTag)
  return logseq.Editor.updateBlock(taskInfo.rawBlock.uuid, newContent)
}

/**
 * delete task
 */
export const deleteTask = async (uuid: string) => {
  return logseq.Editor.removeBlock(uuid)
}

/**
 * parse estimated duration string
 * @param durationString string example: 1h30m
 * @returns number value unit: minute
 * @example parseDurationString('1h30m') -> 90
 * @example parseDurationString('1h') -> 60
 * @example parseDurationString('30m') -> 30
 */
export function parseDurationString(durationString: string): number
export function parseDurationString(durationString: undefined): undefined
export function parseDurationString(durationString: string | undefined): number | undefined {
  if (!durationString) return undefined

  let totalMinutes = 0

  // Extract hours
  const hoursMatch = durationString.match(/(\d+)(?=[hH])/)
  if (hoursMatch) {
    totalMinutes += Number(hoursMatch[0]) * 60
  }

  // Extract minutes
  const minutesMatch = durationString.match(/(\d+)(?=[mM])/)
  if (minutesMatch) {
    totalMinutes += Number(minutesMatch[0])
  }

  return totalMinutes
}

/**
 * generate duration string
 * @param minutes number
 * @returns string
 * @example genDurationString(90) -> '1h30m'
 * @example genDurationString(60) -> '1h'
 * @example genDurationString(30) -> '30m'
 */
export function genDurationString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  let durationString = ''

  if (hours > 0) {
    durationString += hours + 'h'
  }

  if (remainingMinutes > 0) {
    durationString += remainingMinutes + 'm'
  }

  return durationString
}

type AgendaDrawer = { estimated?: number; end?: Dayjs }
/**
 * parse agenda drawer
 */
export function parseAgendaDrawer(blockContent: string): AgendaDrawer | null {
  const regex = AGENDA_DRAWER_REGEX
  const matches = blockContent.match(regex)
  const extractedText = matches ? matches[1].trim() : ''
  /**
   * estimated: 1h30m
   * other: aaa
   */
  const properties = extractedText
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      return line.split(':').map((v) => v.trim())
    })
  return properties.length > 0
    ? properties.reduce((acc, cur) => {
        if (cur[0] === 'estimated') return { ...acc, estimated: parseDurationString(cur[1]) }
        if (cur[0] === 'end') return { ...acc, end: dayjs(cur[1], DATE_FORMATTER) }
        return { ...acc, [cur[0]]: cur[1] }
      }, {} as AgendaDrawer)
    : null
}
/**
 * generate agenda drawer text
 */
export function genAgendaDrawerText(drawer: AgendaDrawer): string {
  const keys = Object.keys(drawer)
  if (keys.length <= 0) return ''
  const content = keys
    .map((key) => {
      const originalVal = drawer[key]
      if (!originalVal) return null

      let valueText = ''
      if (key === 'estimated') {
        valueText = genDurationString(originalVal)
      } else if (key === 'end') {
        valueText = originalVal.format(DATE_FORMATTER)
      }
      return `${key}: ${valueText}`
    })
    .filter(Boolean)
  if (content.length <= 0) return ''
  return [':AGENDA:', ...content, ':END:'].join('\n')
}

/**
 * update agenda drawer
 */
export function updateAgendaDrawer(blockContent: string, drawer: AgendaDrawer) {
  // const _drawer = drawer
  // if (!drawer.estimated || drawer.estimated === DEFAULT_ESTIMATED_TIME) delete _drawer.estimated
  const newText = genAgendaDrawerText(drawer)
  if (!AGENDA_DRAWER_REGEX.test(blockContent) && newText) return blockContent + '\n' + newText
  return blockContent.replace(AGENDA_DRAWER_REGEX, '\n' + newText)
}
/**
 * updateScheduled
 */
export function updateScheduled(blockContent: string, { start, allDay }: { start?: Dayjs; allDay?: boolean }) {
  const scheduleText = start
    ? `SCHEDULED: <${start.format(allDay ? SCHEDULED_DATE_FORMATTER : SCHEDULED_DATETIME_FORMATTER)}>`
    : null
  if (!/^SCHEDULED: </gm.test(blockContent) && scheduleText) {
    return blockContent + '\n' + scheduleText
  }
  return blockContent
    .split('\n')
    .map((line) => {
      if (line.startsWith('SCHEDULED: <')) {
        return scheduleText
      }
      return line
    })
    .filter(Boolean)
    .join('\n')
}
/**
 * update title
 */
export function updateTitle(blockContent: string, title: string, status: 'done' | 'todo') {
  const todoTag = status === 'done' ? 'DONE' : 'TODO'
  return blockContent
    .split('\n')
    .map((line, index) => {
      if (index === 0) return `${todoTag} ${title}`
      return line
    })
    .join('\n')
}
/**
 * update time log
 */
export function updateTimeLogText(blockContent: string, timeLogs: { start: Dayjs; end: Dayjs }[] = []) {
  const matches = blockContent.match(LOGBOOK_REGEX)
  const extractedText = matches ? matches[1].trim() : ''
  const otherLog = extractedText
    .split('\n')
    .filter((line) => !line.startsWith('CLOCK: ['))
    ?.filter(Boolean)
  const isHasLogs = otherLog?.length > 0 || timeLogs?.length > 0
  const logbookText = isHasLogs
    ? ['\n:LOGBOOK:', ...otherLog, ...(timeLogs?.map(generateTimeLogText) ?? []), ':END:'].filter(Boolean).join('\n')
    : '\n:LOGBOOK:\n:END:' // 如果为空字符串，则不会更新原有的 logbook

  /**
   * 1. 原来有 log，现在没有，则 replace （注意不能使用空字符串，如果为空字符串，则不会更新原有的 logbook）
   * 2. 原来有 log，现在有，则 replace
   * 3. 原来没有 log，现在有 log，直接拼接
   * 4. 原来没有 log，现在没有 log，什么也不做
   */
  if (!matches && isHasLogs) return blockContent + logbookText
  return blockContent.replace(LOGBOOK_REGEX, logbookText)
}
