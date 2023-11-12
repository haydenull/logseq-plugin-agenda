import dayjs from 'dayjs'
import { atom } from 'jotai'

import type { AgendaTask, AgendaTaskWithStart } from '@/types/task'

export const agendaTasksAtom = atom<AgendaTask[]>([])

export const tasksWithStartAtom = atom<AgendaTaskWithStart[]>((get) => {
  const allTasks = get(agendaTasksAtom)
  return allTasks.filter((task) => task.start) as AgendaTaskWithStart[]
})
export const backlogTasksAtom = atom<AgendaTask[]>((get) => {
  const allTasks = get(agendaTasksAtom)
  return allTasks.filter((task) => task.status === 'todo' && !task.start)
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
