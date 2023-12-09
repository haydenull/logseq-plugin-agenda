import type { AgendaTask } from './task'

export type AgendaTaskObjective = {
  type: 'week' | 'month'
  year: number
  number: number
}

export type AgendaObjective = AgendaTask & {
  objective: AgendaTaskObjective
}
