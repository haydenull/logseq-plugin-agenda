import { message, notification } from 'antd'
import { type Dayjs } from 'dayjs'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback } from 'react'

import { getAgendaTasks, transformBlockToAgendaTask } from '@/Agenda3/helpers/task'
import { settingsAtom } from '@/Agenda3/models/settings'
import { agendaTasksAtom } from '@/Agenda3/models/tasks'
import type { AgendaTask, CreateAgendaTask } from '@/types/task'

import type { CreateObjectiveForm } from '../components/modals/ObjectiveModal/CreateObjectiveModal'
import type { EditObjectiveForm } from '../components/modals/ObjectiveModal/EditObjectiveModal'
import {
  createObjectiveBlock,
  createTaskBlock,
  deleteTaskBlock,
  transformBlockToBlockFromQuery,
  updateBlockDateInfo,
  updateTaskBlock,
} from '../helpers/block'

const useAgendaTasks = () => {
  const settings = useAtomValue(settingsAtom)
  const [tasks, setTasks] = useAtom(agendaTasksAtom)

  const refreshTasks = useCallback(() => {
    if (settings.isInitialized === false) return Promise.resolve()
    return getAgendaTasks(settings).then((res) => {
      setTasks(res)
    })
  }, [settings])

  const updateTaskData = async (
    params:
      | {
          type: 'task'
          id: string
          data: AgendaTask & { projectId?: string }
        }
      | {
          type: 'objective'
          id: string
          data: AgendaTask & { projectId?: string }
          // data: Partial<EditObjectiveForm>
        },
  ) => {
    const { type, id, data } = params
    const block = await transformBlockToBlockFromQuery(
      type === 'task' ? await updateTaskBlock(data) : await updateTaskBlock(data),
    )
    if (!block) {
      message.error('Failed to edit block')
      throw new Error('Failed to edit block')
    }

    const newTask = await transformBlockToAgendaTask(block, settings)
    const isFilterMode = (settings.selectedFilters || [])?.length > 0
    if (isFilterMode && (newTask.filters ?? []).length === 0) {
      const message =
        type === 'task'
          ? 'Edit task successful but task is hidden'
          : 'Edit objective successful but objective is hidden'
      const description =
        type === 'task'
          ? 'Task was hidden because it dose not match any of your filters.'
          : 'Objective was hidden because it dose not match any of your filters.'
      notification.info({
        message,
        description,
        duration: 0,
      })
      return false
    }
    setTasks((_tasks) => {
      return _tasks.map((task) => {
        if (task.id === id) {
          return { ...task, ...data }
        }
        return task
      })
    })
    return newTask
  }

  const updateTaskDate = async (
    id: string,
    dateInfo: { allDay: boolean; start: Dayjs; end?: Dayjs; estimatedTime?: number },
  ) => {
    await updateBlockDateInfo({
      ...dateInfo,
      uuid: id,
    })
    setTasks((_tasks) => {
      return _tasks.map((task) => {
        if (task.id === id) {
          return { ...task, ...dateInfo }
        }
        return task
      })
    })
  }

  const deleteTask = (id: string) => {
    deleteTaskBlock(id)
    setTasks((_tasks) => _tasks.filter((task) => task.id !== id))
  }

  const addNewTask = async (
    params:
      | { type: 'task'; data: CreateAgendaTask }
      | {
          type: 'objective'
          data: CreateObjectiveForm
        },
  ) => {
    const { type, data } = params
    const block = await transformBlockToBlockFromQuery(
      type === 'task' ? await createTaskBlock(data) : await createObjectiveBlock(data),
    )
    if (!block) {
      message.error('Failed to create block')
      throw new Error('Failed to create block')
    }
    const newTask = await transformBlockToAgendaTask(block, settings)
    const isFilterMode = (settings.selectedFilters || [])?.length > 0
    if (isFilterMode && (newTask.filters ?? []).length === 0) {
      const message =
        type === 'task'
          ? 'Create task successful but task is hidden'
          : 'Create objective successful but objective is hidden'
      const description =
        type === 'task'
          ? 'Task was hidden because it dose not match any of your filters.'
          : 'Objective was hidden because it dose not match any of your filters.'
      notification.info({
        message,
        description,
        duration: 0,
      })
      return false
    }
    setTasks((_tasks) => _tasks.concat(newTask))
    return newTask
  }

  return { tasks, refreshTasks, updateTaskData, updateTaskDate, addNewTask, deleteTask }
}

export default useAgendaTasks
