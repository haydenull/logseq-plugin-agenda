import dayjs from 'dayjs'
import { atom } from 'jotai'

import { RECENT_DAYS_RANGE } from '@/constants/agenda'
import type { AgendaTaskWithStart, AgendaTaskWithStartOrDeadline } from '@/types/task'

import { agendaEntitiesAtom } from './entities'
import { agendaObjectivesAtom } from './objectives'

// task
export const tasksWithStartAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allEntities = get(agendaEntitiesAtom)
  const allObjectives = get(agendaObjectivesAtom)
  return allEntities
    .filter((entity) => entity.start && !entity.objective)
    .map((task) => {
      return {
        ...task,
        bindObjective: allObjectives.find((objective) => objective.id === task.bindObjectiveId),
      }
    }) as AgendaTaskWithStart[]
})
export const tasksWithStartOrDeadlineAtom = atom<AgendaTaskWithStartOrDeadline[]>((get) => {
  const allEntities = get(agendaEntitiesAtom)
  const allObjectives = get(agendaObjectivesAtom)
  return allEntities
    .filter((entity) => !entity.objective && (entity.start || entity.deadline))
    .map((task) => {
      return {
        ...task,
        bindObjective: allObjectives.find((objective) => objective.id === task.bindObjectiveId),
      } as AgendaTaskWithStartOrDeadline
    })
})
export const recentTasksAtom = atom<AgendaTaskWithStartOrDeadline[]>((get) => {
  const allTasks = get(tasksWithStartOrDeadlineAtom)

  const today = dayjs()
  const [rangeStart, rangeEnd] = RECENT_DAYS_RANGE
  const startDay = today.subtract(rangeStart, 'day')
  const endDay = today.add(rangeEnd, 'day')
  return allTasks.filter((task) => {
    if (task.start) {
      return (
        task.start?.isBetween(startDay, endDay, 'day', '[]') ||
        task.end?.isBetween(startDay, endDay, 'day', '[]') ||
        (task.start?.isBefore(startDay, 'day') && task.end?.isAfter(endDay, 'day'))
      )
    }
    if (task.deadline?.value) return task.deadline.value?.isBetween(startDay, endDay, 'day', '[]')
    return false
  })
})

export const todayTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  return allTasks.filter((task) => {
    return task.start.isSame(today, 'day')
  })
})
export const tomorrowTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const tomorrow = dayjs().add(1, 'day')
  return allTasks.filter((task) => {
    return task.start.isSame(tomorrow, 'day')
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
export const thisWeekExcludeTomorrowTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  const tomorrow = today.add(1, 'day')
  const startDay = tomorrow
  const endDay = today.endOf('week')
  if (tomorrow.isSameOrAfter(endDay, 'day')) return []
  return allTasks.filter((task) => {
    return task.start.isBetween(startDay, endDay, 'day', '(]')
  })
})

export const thisMonthTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  const startDay = today.endOf('week')
  const endDay = today.endOf('month')
  if (startDay.isSameOrAfter(endDay, 'day')) return []
  return allTasks.filter((task) => {
    return task.start.isBetween(startDay, endDay, 'day', '(]')
  })
})
export const thisMonthExcludeTomorrowTasksAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(tasksWithStartAtom)

  const today = dayjs()
  const tomorrow = today.add(1, 'day')
  let startDay = today.endOf('week')
  if (tomorrow.isAfter(startDay)) startDay = tomorrow
  const endDay = today.endOf('month')
  if (startDay.isSameOrAfter(endDay, 'day')) return []
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
