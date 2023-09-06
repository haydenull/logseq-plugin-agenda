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
  const allTasks = get(agendaTasksAtom)

  const startDay = dayjs().subtract(7, 'day')
  const endDay = dayjs().add(14, 'day')
  return allTasks.filter((task) => {
    if (!task.start) return false
    return task.start.isBetween(startDay, endDay, 'day', '[]')
  }) as AgendaTaskWithStart[]
})
