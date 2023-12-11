import type { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'
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
  deleteBlockDateInfo,
  deleteTaskBlock,
  transformBlockToBlockFromQuery,
  updateBlockDateInfo,
  updateBlockTaskStatus,
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

  const updateTask = async (
    params:
      | {
          type: 'task'
          id: string
          data: AgendaTask & { projectId?: string }
        }
      | {
          type: 'task-date'
          id: string
          data: { allDay: boolean; start: Dayjs; end?: Dayjs; estimatedTime?: number }
        }
      | {
          type: 'task-status'
          id: string
          data: AgendaTask['status']
        }
      | {
          type: 'task-remove-date'
          id: string
          data: null
        }
      | {
          type: 'objective'
          id: string
          data: AgendaTask & { projectId?: string }
          // data: Partial<EditObjectiveForm>
        },
  ) => {
    const { type, id, data } = params
    const task = tasks.find((task) => task.id === id)
    if (!task) {
      message.error('Task not found')
      throw new Error('Task not found')
    }
    let rawBlock: BlockEntity | null = null
    switch (type) {
      case 'task':
        rawBlock = await updateTaskBlock(data)
        break
      case 'task-date':
        rawBlock = await updateBlockDateInfo({
          ...data,
          uuid: id,
        })
        break
      case 'task-status':
        rawBlock = await updateBlockTaskStatus(task, data)
        break
      case 'task-remove-date':
        rawBlock = await deleteBlockDateInfo(id)
        break
      default:
        break
    }
    const block = await transformBlockToBlockFromQuery(rawBlock)
    if (!block) {
      message.error('Failed to edit block')
      throw new Error('Failed to edit block')
    }

    const newTask = await transformBlockToAgendaTask(block, settings)
    const isFilterMode = (settings.selectedFilters || [])?.length > 0
    if (isFilterMode && (newTask.filters ?? []).length === 0) {
      const message = type.startsWith('task')
        ? 'Edit task successful but task is hidden'
        : 'Edit objective successful but objective is hidden'
      const description = type.startsWith('task')
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
          return { ...task, ...newTask }
        }
        return task
      })
    })
    return newTask
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

  return { tasks, refreshTasks, updateTask, addNewTask, deleteTask }
}

export default useAgendaTasks
