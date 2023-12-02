import { type Dayjs } from 'dayjs'
import type { Overwrite } from 'utility-types'

import { type BlockFromQuery } from '@/Agenda3/helpers/task'
import { type Filter } from '@/Agenda3/models/settings'

import type { RRule } from './fullcalendar'
import type { AgendaProject } from './project'

// full calendar event object https://fullcalendar.io/docs/event-object

export type AgendaTaskPage = {
  uuid: string
  originalName: string
  isJournal: boolean
  journalDay?: number
  properties?: Record<string, string>
}
export type AgendaTaskObjective = {
  type: 'week' | 'month'
  year: number
  number: number
}
export type TimeLog = { start: Dayjs; end: Dayjs; amount: number /** unit: minute */ }
export type AgendaTask = {
  id: string // uuid
  title: string
  status: 'todo' | 'done'
  allDay: boolean
  start?: Dayjs // logseq scheduled
  end?: Dayjs // from agenda drawer end
  deadline?: Dayjs // logseq deadline
  project: AgendaProject // logseq page
  label?: AgendaTaskPage // logseq page
  filters?: Filter[]
  repeat?: string // from logseq scheduled
  estimatedTime?: number // unit: minute, from agenda drawer estimated
  actualTime?: number // unit: minute
  timeLogs?: TimeLog[] // from logbook
  subtasks?: AgendaTask[] // children blocks which are task
  notes?: string[] // children blocks which are normal block
  rrule?: RRule
  doneHistory?: Dayjs[] // recurrence done history
  recurringPast?: boolean // is recurring past task
  // from agenda drawer objective
  objective?: AgendaTaskObjective
  rawBlock: BlockFromQuery // raw block entity
}

export type AgendaTaskWithStart = AgendaTask & {
  start: Dayjs
}

export type AgendaObjective = AgendaTask & {
  objective: AgendaTaskObjective
}

export type CreateAgendaTask = { projectId?: string } & Overwrite<
  Partial<AgendaTask>,
  {
    title: string
    start: Dayjs
    allDay: boolean
    estimatedTime?: number
  }
>
