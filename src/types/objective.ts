import type { AgendaEntity } from './entity'

export type AgendaEntityObjective = {
  type: 'week' | 'month'
  year: number
  number: number
}

export type AgendaObjective = AgendaEntity & {
  objective: AgendaEntityObjective
}
