import { message } from 'antd'
import { useAtom, useAtomValue } from 'jotai'

import { getAllProjects } from '@/Agenda3/helpers/project'
import {
  allProjectsAtom,
  favoriteProjectsAtom,
  journalProjectsAtom,
  normalProjectsAtom,
} from '@/Agenda3/models/projects'

const usePages = () => {
  const [, setProjects] = useAtom(allProjectsAtom)
  const favoritePages = useAtomValue(favoriteProjectsAtom)
  const normalPages = useAtomValue(normalProjectsAtom)
  const journalPages = useAtomValue(journalProjectsAtom)
  const allPages = [...favoritePages, ...normalPages, ...journalPages]
  const refreshPages = async () => {
    try {
      const projects = await getAllProjects()
      setProjects(projects)
      return true
    } catch (error) {
      console.error('Failed to load Logseq DB pages', error)
      message.error('Failed to load Logseq pages')
      return false
    }
  }

  return {
    refreshPages,
    favoritePages,
    normalPages,
    journalPages,
    allPages,
  }
}

export default usePages
