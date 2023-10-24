import { useAtom, useAtomValue } from 'jotai'

import { getAllProjects } from '@/newHelper/project'
import { allProjectsAtom, favoriteProjectsAtom, journalProjectsAtom, normalProjectsAtom } from '@/newModel/projects'

const useNewProjects = () => {
  const [, setProjects] = useAtom(allProjectsAtom)
  const favoriteProjects = useAtomValue(favoriteProjectsAtom)
  const normalProjects = useAtomValue(normalProjectsAtom)
  const journalProjects = useAtomValue(journalProjectsAtom)
  const refreshProjects = () => {
    getAllProjects().then((projects) => setProjects(projects))
  }

  return {
    refreshProjects,
    favoriteProjects,
    normalProjects,
    journalProjects,
  }
}

export default useNewProjects
