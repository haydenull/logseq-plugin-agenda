import { type Dayjs } from 'dayjs'
import type { Overwrite } from 'utility-types'

import type { AgendaEntity } from './entity'
import type { AgendaObjective } from './objective'

// full calendar event object https://fullcalendar.io/docs/event-object
export type TimeLog = { start: Dayjs; end: Dayjs; amount: number /** unit: minute */ }
export type AgendaTaskWithStart = AgendaEntity & {
  start: Dayjs
  /** The detailed information of the objective bound to the current task */
  bindObjective?: AgendaObjective
}

export type CreateAgendaTask = { projectId?: string } & Overwrite<
  Partial<AgendaEntity>,
  {
    title: string
    start: Dayjs
    allDay: boolean
    estimatedTime?: number
  }
>
