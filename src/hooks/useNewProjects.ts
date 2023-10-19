import { useAtom } from 'jotai'

import { getAllProjects } from '@/newHelper/project'
import { allProjectsAtom } from '@/newModel/projects'

const useNewProjects = () => {
  const [, setProjects] = useAtom(allProjectsAtom)
  const refreshProjects = () => {
    getAllProjects().then((projects) => setProjects(projects))
  }

  return {
    refreshProjects,
  }
}

export default useNewProjects
