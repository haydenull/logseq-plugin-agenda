import { atom } from 'jotai'

import type { AgendaBacklog } from '@/types/backlog'

import { agendaEntitiesAtom } from './entities'

// backlog
export const backlogsAtom = atom<AgendaBacklog[]>((get) => {
  const allTasks = get(agendaEntitiesAtom)
  return allTasks.filter((task) => task.status === 'todo' && !task.start && !task.objective)
})
