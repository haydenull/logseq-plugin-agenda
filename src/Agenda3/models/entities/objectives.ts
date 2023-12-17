import dayjs from 'dayjs'
import { atom } from 'jotai'

import type { AgendaObjective, AgendaObjectiveWithTasks } from '@/types/objective'

import { agendaEntitiesAtom } from './entities'
import { tasksWithStartAtom } from './tasks'

// objective
export const agendaObjectivesAtom = atom<AgendaObjective[]>((get) => {
  const allTasks = get(agendaEntitiesAtom)
  return allTasks.filter((task) => task.objective) as AgendaObjective[]
})

export const objectivesWithTasksAtom = atom<AgendaObjectiveWithTasks[]>((get) => {
  const tasks = get(tasksWithStartAtom)
  const objectives = get(agendaObjectivesAtom)
  return objectives.map((objective) => {
    const { id } = objective
    const tasksWithObjective = tasks.filter((task) => task.bindObjectiveId === id)
    return { ...objective, tasks: tasksWithObjective }
  })
})

export const thisWeekObjectivesAtom = atom<AgendaObjectiveWithTasks[]>((get) => {
  const today = dayjs()
  const yearNumber = today.year()
  const weekNumber = today.isoWeek()
  const allObjectives = get(objectivesWithTasksAtom)
  return allObjectives.filter(({ objective }) => {
    const { type, year, number } = objective
    return type === 'week' && year === yearNumber && number === weekNumber
  })
})
export const thisMonthObjectivesAtom = atom<AgendaObjectiveWithTasks[]>((get) => {
  const today = dayjs()
  const yearNumber = today.year()
  const monthNumber = today.month() + 1
  const allObjectives = get(objectivesWithTasksAtom)
  return allObjectives.filter(({ objective }) => {
    const { type, year, number } = objective
    return type === 'month' && year === yearNumber && number === monthNumber
  })
})
