import dayjs from 'dayjs'
import { atom } from 'jotai'

import type { AgendaObjective, AgendaTask, AgendaTaskWithStart } from '@/types/task'

export const agendaTasksAtom = atom<AgendaTask[]>([])

// task
export const tasksWithStartAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(agendaTasksAtom)
  return allTasks.filter((task) => task.start && !task.objective) as AgendaTaskWithStart[]
})
// backlog
export const backlogTasksAtom = atom<AgendaTask[]>((get) => {
  const allTasks = get(agendaTasksAtom)
  return allTasks.filter((task) => task.status === 'todo' && !task.start && !task.objective)
})
// objective
export const agendaObjectivesAtom = atom<AgendaObjective[]>((get) => {
  const allTasks = get(agendaTasksAtom)
  return allTasks.filter((task) => task.objective) as AgendaObjective[]
})

export const recentTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  const startDay = today.subtract(7, 'day')
  const endDay = today.add(14, 'day')
  return allTasks.filter((task) => {
    if (!task.start) return false
    return task.start.isBetween(startDay, endDay, 'day', '[]')
  })
})

export const todayTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  return allTasks.filter((task) => {
    return task.start.isSame(today, 'day')
  })
})

export const thisWeekTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  const startDay = today
  const endDay = today.endOf('week')
  return allTasks.filter((task) => {
    return task.start.isBetween(startDay, endDay, 'day', '(]')
  })
})

export const thisMonthTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  const startDay = today.endOf('week')
  const endDay = today.endOf('month')
  return allTasks.filter((task) => {
    return task.start.isBetween(startDay, endDay, 'day', '(]')
  })
})

export const overdueTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  return allTasks.filter((task) => {
    if (!task.start || task.status === 'done') return false
    // multiple days task
    if (task.end) return task.end.isBefore(today, 'day')
    return task.start.isBefore(today, 'day')
  })
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
