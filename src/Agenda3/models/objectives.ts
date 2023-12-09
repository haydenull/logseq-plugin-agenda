import dayjs from 'dayjs'
import { atom } from 'jotai'

import type { AgendaObjective } from '@/types/objective'

import { agendaTasksAtom } from './tasks'

// objective
export const agendaObjectivesAtom = atom<AgendaObjective[]>((get) => {
  const allTasks = get(agendaTasksAtom)
  return allTasks.filter((task) => task.objective) as AgendaObjective[]
})

export const thisWeekObjectivesAtom = atom<AgendaObjective[]>((get) => {
  const today = dayjs()
  const yearNumber = today.year()
  const weekNumber = today.isoWeek()
  const allObjectives = get(agendaObjectivesAtom)
  return allObjectives.filter(({ objective }) => {
    const { type, year, number } = objective
    return type === 'week' && year === yearNumber && number === weekNumber
  })
})
export const thisMonthObjectivesAtom = atom<AgendaObjective[]>((get) => {
  const today = dayjs()
  const yearNumber = today.year()
  const monthNumber = today.month() + 1
  const allObjectives = get(agendaObjectivesAtom)
  return allObjectives.filter(({ objective }) => {
    const { type, year, number } = objective
    return type === 'month' && year === yearNumber && number === monthNumber
  })
})
