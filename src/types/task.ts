import { type Dayjs } from 'dayjs'
import type { Overwrite } from 'utility-types'

import { type BlockFromQuery } from '@/newHelper/task'

import type { RRule } from './fullcalendar'

// full calendar event object https://fullcalendar.io/docs/event-object

export type AgendaTaskPage = {
  originalName: string
  isJournal: boolean
  journalDay?: number
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
  project: AgendaTaskPage // logseq page
  label?: AgendaTaskPage // logseq page
  repeat?: string // from logseq scheduled
  estimatedTime?: number // unit: minute, from agenda drawer estimated
  actualTime?: number // unit: minute
  timeLogs: TimeLog[] // from logbook
  subtasks?: AgendaTask[] // children blocks which are task
  notes?: string[] // children blocks which are normal block
  rrule?: RRule
  doneHistory?: Dayjs[] // recurrence done history
  recurringPast?: boolean // is recurring past task
  rawBlock: BlockFromQuery // raw block entity
}

export type AgendaTaskWithStart = AgendaTask & {
  start: Dayjs
}

export type CreateAgendaTask = Overwrite<
  Partial<AgendaTask>,
  {
    title: string
    start: Dayjs
    allDay: boolean
    estimatedTime?: number
  }
>
