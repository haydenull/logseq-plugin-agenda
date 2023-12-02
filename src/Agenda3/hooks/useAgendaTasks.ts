import { useAtom, useAtomValue } from 'jotai'
import { useCallback } from 'react'

import { getAgendaTasks } from '@/Agenda3/helpers/task'
import { settingsAtom } from '@/Agenda3/models/settings'
import { agendaTasksAtom } from '@/Agenda3/models/tasks'
import type { AgendaTask } from '@/types/task'

const useAgendaTasks = () => {
  const settings = useAtomValue(settingsAtom)
  const [tasks, setTasks] = useAtom(agendaTasksAtom)

  const refreshTasks = useCallback(() => {
    if (settings.isInitialized === false) return Promise.resolve()
    return getAgendaTasks(settings).then((res) => {
      setTasks(res)
    })
  }, [settings])

  // When using, please do not forget to modify corresponding block
  const updateTaskData = (id: string, data: Partial<AgendaTask>) => {
    setTasks((_tasks) => {
      return _tasks.map((task) => {
        if (task.id === id) {
          return { ...task, ...data }
        }
        return task
      })
    })
  }

  // When using, please do not forget to modify corresponding block
  const deleteTask = (id: string) => {
    setTasks((_tasks) => _tasks.filter((task) => task.id !== id))
  }

  // When using, please do not forget to create corresponding block
  const addNewTask = (newTask: AgendaTask) => {
    setTasks((_tasks) => _tasks.concat(newTask))
  }

  return { tasks, refreshTasks, updateTaskData, addNewTask, deleteTask }
}

export default useAgendaTasks
