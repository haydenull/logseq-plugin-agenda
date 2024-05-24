import { type Dayjs } from 'dayjs'

import { type BlockFromQuery } from '@/Agenda3/helpers/task'
import { type Filter } from '@/Agenda3/models/settings'

import type { RRule } from './fullcalendar'
import type { AgendaEntityObjective } from './objective'
import type { AgendaProject } from './project'
import type { TimeLog } from './task'

export type AgendaEntity = {
  id: string // uuid
  title: string
  showTitle: string
  status: 'todo' | 'done'
  allDay: boolean
  start?: Dayjs // logseq scheduled
  end?: Dayjs // from agenda drawer end
  // logseq deadline
  deadline?: AgendaEntityDeadline
  project: AgendaProject // logseq page
  label?: AgendaEntityPage // logseq page
  filters?: Filter[]
  repeat?: string // from logseq scheduled
  estimatedTime?: number // unit: minute, from agenda drawer estimated
  actualTime?: number // unit: minute
  timeLogs?: TimeLog[] // from logbook
  subtasks?: AgendaEntity[] // children blocks which are task
  notes?: string[] // children blocks which are normal block
  rrule?: RRule
  doneHistory?: Dayjs[] // recurrence done history
  recurringPast?: boolean // is recurring past task

  /** only Objective Entity has: from agenda drawer objective */
  objective?: AgendaEntityObjective
  /** which Objective Entity bind of */
  bindObjectiveId?: string // from agenda drawer objectiveId
  rawBlock: BlockFromQuery // raw block entity
}

export type AgendaEntityPage = {
  uuid: string
  originalName: string
  isJournal: boolean
  journalDay?: number
  properties?: Record<string, string>
}
export type AgendaEntityDeadline = {
  value: Dayjs
  allDay: boolean
}
