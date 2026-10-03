import dayjs, { type Dayjs } from 'dayjs'

import type { AgendaEntity } from '@/types/entity'
import type { AgendaTaskWithStartOrDeadline, CreateAgendaTask } from '@/types/task'

const STATUS_PROPERTY = 'logseq.property/status'
const SCHEDULED_PROPERTY = 'logseq.property/scheduled'
const DEADLINE_PROPERTY = 'logseq.property/deadline'
const END_PROPERTY = 'agenda3_end_date'
const ESTIMATED_PROPERTY = 'agenda3_estimated_time'
const START_ALL_DAY_PROPERTY = 'agenda3_start_all_day'
const DEADLINE_ALL_DAY_PROPERTY = 'agenda3_deadline_all_day'
const TASK_TAG_IDENT = 'logseq.class/Task'

function readProperty(properties: Record<string, unknown> | null, key: string) {
  if (!properties) return undefined
  return properties[key] ?? properties[`:${key}`]
}

export async function writeDbTaskStatus(blockId: string, status: AgendaEntity['status']) {
  await logseq.Editor.upsertBlockProperty(blockId, STATUS_PROPERTY, status === 'done' ? 'Done' : 'Todo')
}

function dateValue(date: Dayjs | undefined) {
  return date?.valueOf()
}

async function writeDateProperty(blockId: string, property: string, date: Dayjs | undefined) {
  if (date) {
    await logseq.Editor.upsertBlockProperty(blockId, property, dateValue(date))
  } else {
    await logseq.Editor.removeBlockProperty(blockId, property)
  }
}

async function writeOptionalProperty(blockId: string, property: string, value: unknown) {
  if (value === undefined || value === null) {
    await logseq.Editor.removeBlockProperty(blockId, property)
  } else {
    await logseq.Editor.upsertBlockProperty(blockId, property, value)
  }
}

async function ensureAgendaTaskProperties() {
  await Promise.all([
    logseq.Editor.upsertProperty(
      END_PROPERTY,
      { type: 'date', cardinality: 'one', hide: true },
      { name: 'Agenda End Date' },
    ),
    logseq.Editor.upsertProperty(
      ESTIMATED_PROPERTY,
      { type: 'number', cardinality: 'one', hide: true },
      { name: 'Agenda Estimated Time' },
    ),
    logseq.Editor.upsertProperty(
      START_ALL_DAY_PROPERTY,
      { type: 'checkbox', cardinality: 'one', hide: true },
      { name: 'Agenda Start Is All Day' },
    ),
    logseq.Editor.upsertProperty(
      DEADLINE_ALL_DAY_PROPERTY,
      { type: 'checkbox', cardinality: 'one', hide: true },
      { name: 'Agenda Deadline Is All Day' },
    ),
  ])
}

async function getTargetPage(projectId?: string) {
  if (projectId) {
    const page = await logseq.Editor.getPage(projectId)
    if (!page) throw new Error(`Logseq DB page not found: ${projectId}`)
    return page
  }

  const todayPage = await logseq.Editor.getTodayPage()
  const page = todayPage ?? (await logseq.Editor.createJournalPage(new Date()))
  if (!page) throw new Error("Unable to open or create today's journal page")
  return page
}

async function ensureTaskTag() {
  const taskTag = (await logseq.Editor.getTag(TASK_TAG_IDENT)) ?? (await logseq.Editor.getTag('Task'))
  if (!taskTag) throw new Error('Logseq DB Task tag is unavailable')
  return taskTag
}

async function moveBlockToPage(blockId: string, pageId: string) {
  const page = await logseq.Editor.getPage(pageId)
  if (!page) throw new Error(`Logseq DB page not found: ${pageId}`)
  const blocks = (await logseq.Editor.getPageBlocksTree(page.uuid)) ?? []
  const lastBlock = blocks[blocks.length - 1]
  await logseq.Editor.moveBlock(blockId, lastBlock?.uuid ?? page.uuid, { children: false })
}

export async function createDbTask(task: CreateAgendaTask) {
  const [page, taskTag] = await Promise.all([getTargetPage(task.projectId), ensureTaskTag()])

  const block = await logseq.Editor.appendBlockInPage(page.uuid, task.title.trim())
  if (!block) throw new Error('Failed to create Logseq DB task block')

  try {
    await ensureAgendaTaskProperties()
    await logseq.Editor.addBlockTag(block.uuid, taskTag.uuid)
    await logseq.Editor.upsertBlockProperty(block.uuid, STATUS_PROPERTY, 'Todo')
    await writeDateProperty(block.uuid, SCHEDULED_PROPERTY, task.start)
    await writeDateProperty(block.uuid, DEADLINE_PROPERTY, task.deadline?.value)
    await writeDateProperty(block.uuid, END_PROPERTY, task.end)
    await writeOptionalProperty(block.uuid, ESTIMATED_PROPERTY, task.estimatedTime)
    await writeOptionalProperty(block.uuid, START_ALL_DAY_PROPERTY, task.start ? task.allDay !== false : undefined)
    await writeOptionalProperty(block.uuid, DEADLINE_ALL_DAY_PROPERTY, task.deadline?.allDay)
    return await logseq.Editor.getBlock(block.uuid)
  } catch (error) {
    await logseq.Editor.removeBlock(block.uuid)
    throw error
  }
}

export async function updateDbTask(task: AgendaTaskWithStartOrDeadline & { projectId?: string }) {
  const block = await logseq.Editor.getBlock(task.id)
  if (!block) throw new Error(`Logseq DB task not found: ${task.id}`)

  await ensureAgendaTaskProperties()
  await logseq.Editor.updateBlock(task.id, task.title.trim())
  await writeDbTaskStatus(task.id, task.status)
  await writeDateProperty(task.id, SCHEDULED_PROPERTY, task.start)
  await writeDateProperty(task.id, DEADLINE_PROPERTY, task.deadline?.value)
  await writeDateProperty(task.id, END_PROPERTY, task.end)
  await writeOptionalProperty(task.id, ESTIMATED_PROPERTY, task.estimatedTime)
  await writeOptionalProperty(task.id, START_ALL_DAY_PROPERTY, task.start ? task.allDay : undefined)
  await writeOptionalProperty(task.id, DEADLINE_ALL_DAY_PROPERTY, task.deadline?.allDay)

  const sourcePageId = block.page.id
  const targetPage = await getTargetPage(task.projectId)
  if (sourcePageId !== targetPage.id) {
    await moveBlockToPage(task.id, targetPage.uuid)
  }

  return logseq.Editor.getBlock(task.id)
}

export async function updateDbTaskSchedule(
  blockId: string,
  data: {
    start: Dayjs
    end?: Dayjs
    estimatedTime?: number
    allDay?: boolean
  },
) {
  const block = await logseq.Editor.getBlock(blockId)
  if (!block) throw new Error(`Logseq DB task not found: ${blockId}`)
  await ensureAgendaTaskProperties()
  await writeDateProperty(blockId, SCHEDULED_PROPERTY, data.start)
  await writeDateProperty(blockId, END_PROPERTY, data.end)
  await writeOptionalProperty(blockId, ESTIMATED_PROPERTY, data.estimatedTime)
  await writeOptionalProperty(blockId, START_ALL_DAY_PROPERTY, data.start ? data.allDay : undefined)
  return logseq.Editor.getBlock(blockId)
}

export async function removeDbTaskSchedule(blockId: string) {
  const block = await logseq.Editor.getBlock(blockId)
  if (!block) throw new Error(`Logseq DB task not found: ${blockId}`)
  await logseq.Editor.removeBlockProperty(blockId, SCHEDULED_PROPERTY)
  await logseq.Editor.removeBlockProperty(blockId, END_PROPERTY)
  await logseq.Editor.removeBlockProperty(blockId, ESTIMATED_PROPERTY)
  await logseq.Editor.removeBlockProperty(blockId, START_ALL_DAY_PROPERTY)
  return logseq.Editor.getBlock(blockId)
}

function dayjsFromDbValue(value: unknown): Dayjs | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'object' && 'value' in value) {
    return dayjsFromDbValue((value as { value: unknown }).value)
  }
  const date = dayjs(value as string | number | Date)
  return date.isValid() ? date : undefined
}

export function getDbDateValue(properties: Record<string, unknown> | null, key: string) {
  return dayjsFromDbValue(readProperty(properties, key))
}

export function getDbScalarValue(properties: Record<string, unknown> | null, key: string) {
  return readProperty(properties, key)
}

export function getDbTaskStatus(blockProperties: Record<string, unknown> | null) {
  const value = readProperty(blockProperties, STATUS_PROPERTY)
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return undefined
  const status = value as Record<string, unknown>
  const label = status.title ?? status.name ?? status.ident
  return typeof label === 'string' ? label : undefined
}

export function isCanceledDbStatus(status: string) {
  const value = status.toLocaleLowerCase().replace(/^.*status\./, '')
  return value === 'canceled' || value === 'cancelled'
}

export function isCompletedDbStatus(status: string) {
  const value = status.toLocaleLowerCase().replace(/^.*status\./, '')
  return value === 'done' || value === 'completed'
}
