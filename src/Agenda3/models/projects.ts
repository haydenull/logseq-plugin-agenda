import { atom } from 'jotai'

import type { AgendaProject } from '@/types/project'

export const allProjectsAtom = atom<AgendaProject[]>([])

export const favoriteProjectsAtom = atom<AgendaProject[]>((get) => {
  const allProjects = get(allProjectsAtom)
  return allProjects.filter((project) => project.isFavorite)
})

export const journalProjectsAtom = atom<AgendaProject[]>((get) => {
  const allProjects = get(allProjectsAtom)
  return allProjects.filter((project) => project.isJournal && !project.isFavorite)
})

export const normalProjectsAtom = atom<AgendaProject[]>((get) => {
  const allProjects = get(allProjectsAtom)
  return allProjects.filter((project) => !project.isJournal && !project.isFavorite)
})
