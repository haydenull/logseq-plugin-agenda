import { useEffect, useState } from 'react'

const useProjects = () => {
  const [projects, setProjects] = useState<{ label: string; value: string; color: string }[]>([])

  useEffect(() => {
    logseq.Editor.getAllPages().then((pages) => {
      const journal = { value: 'journal', label: 'Journal', color: '#afafaf' }
      const _projects =
        pages
          ?.filter((item) => !item?.['journal?'])
          ?.sort((a, b) => {
            return (a.updatedAt || 0) - (b.updatedAt || 0)
          })
          ?.map((item) => ({
            value: item.originalName,
            label: item.originalName,
            color: '#afafaf',
          })) ?? []
      setProjects([journal].concat(_projects))
    })
  }, [])

  return projects
}

export default useProjects
