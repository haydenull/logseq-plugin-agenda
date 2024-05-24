import type { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'
import { message, notification } from 'antd'
import { type Dayjs } from 'dayjs'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback } from 'react'

import { getAgendaEntities, transformBlockToAgendaEntity } from '@/Agenda3/helpers/task'
import { settingsAtom } from '@/Agenda3/models/settings'
import type { AgendaEntity } from '@/types/entity'
import type { AgendaObjective } from '@/types/objective'
import type { AgendaTaskWithStart, AgendaTaskWithStartOrDeadline, CreateAgendaTask } from '@/types/task'

import type { CreateObjectiveForm } from '../components/modals/ObjectiveModal/CreateObjectiveModal'
import type { EditObjectiveForm } from '../components/modals/ObjectiveModal/EditObjectiveModal'
import {
  createObjectiveBlock,
  createTaskBlock,
  deleteBlockDateInfo,
  deleteEntityBlock,
  transformBlockToBlockFromQuery,
  updateBlockDateInfo,
  updateBlockTaskStatus,
  updateObjectiveBlock,
  updateTaskBlock,
} from '../helpers/block'
import { agendaEntitiesAtom } from '../models/entities/entities'

const useAgendaEntities = () => {
  const settings = useAtomValue(settingsAtom)
  const [entities, setEntities] = useAtom(agendaEntitiesAtom)

  const refreshEntities = useCallback(() => {
    if (settings.isInitialized === false) return Promise.resolve()
    return getAgendaEntities(settings).then((res) => {
      setEntities(res)
    })
  }, [settings])

  const updateEntity = async (
    params:
      | {
          type: 'task'
          id: string
          data: AgendaTaskWithStartOrDeadline & { projectId?: string }
        }
      | {
          type: 'task-date'
          id: string
          data: { allDay: boolean; start: Dayjs; end?: Dayjs; estimatedTime?: number }
        }
      | {
          type: 'task-status'
          id: string
          data: AgendaTaskWithStart['status']
        }
      | {
          type: 'task-remove-date'
          id: string
          data: null
        }
      | {
          type: 'objective'
          id: string
          data: Partial<EditObjectiveForm>
        }
      | {
          type: 'objective-status'
          id: string
          data: AgendaObjective['status']
        },
  ) => {
    const { type, id, data } = params
    const task = entities.find((task) => task.id === id)
    if (!task) {
      message.error('Entity not found')
      throw new Error('Entity not found')
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
      case 'objective-status':
        rawBlock = await updateBlockTaskStatus(task, data)
        break
      case 'task-remove-date':
        rawBlock = await deleteBlockDateInfo(id)
        break
      case 'objective':
        // 如果执行到这个分支，说明 task.objective 一定存在
        rawBlock = await updateObjectiveBlock({
          ...task,
          ...data,
        } as AgendaObjective)
        break
      default:
        break
    }
    const block = await transformBlockToBlockFromQuery(rawBlock)
    if (!block) {
      message.error('Failed to edit block')
      throw new Error('Failed to edit block')
    }

    const newTask = await transformBlockToAgendaEntity(block, settings)
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
    setEntities((_tasks) => {
      return _tasks.map((task) => {
        if (task.id === id) {
          return { ...task, ...newTask }
        }
        return task
      })
    })
    return newTask
  }

  const deleteEntity = (id: string) => {
    deleteEntityBlock(id)
    setEntities((_tasks) => _tasks.filter((task) => task.id !== id))
  }

  const addNewEntity = async (
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
    const newTask = await transformBlockToAgendaEntity(block, settings)
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
    console.log('[faiz:] === newTask', newTask)
    setEntities((_tasks) => _tasks.concat(newTask))
    return newTask
  }

  return {
    entities,
    refreshEntities,
    updateEntity,
    addNewEntity,
    deleteEntity,
  }
}

export default useAgendaEntities
