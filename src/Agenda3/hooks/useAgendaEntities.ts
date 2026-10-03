import { message } from 'antd'
import type { Dayjs } from 'dayjs'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback } from 'react'

import { getAgendaEntities, getDbAgendaEntity } from '@/Agenda3/helpers/task'
import { settingsAtom } from '@/Agenda3/models/settings'
import type { AgendaEntity } from '@/types/entity'
import type { AgendaObjective } from '@/types/objective'
import type { AgendaTaskWithStart, AgendaTaskWithStartOrDeadline, CreateAgendaTask } from '@/types/task'

import type { CreateObjectiveForm } from '../components/modals/ObjectiveModal/CreateObjectiveModal'
import type { EditObjectiveForm } from '../components/modals/ObjectiveModal/EditObjectiveModal'
import {
  createTaskBlock,
  deleteBlockDateInfo,
  deleteEntityBlock,
  updateBlockDateInfo,
  updateBlockTaskStatus,
  updateTaskBlock,
} from '../helpers/block'
import { agendaEntitiesAtom } from '../models/entities/entities'

const useAgendaEntities = () => {
  const settings = useAtomValue(settingsAtom)
  const [entities, setEntities] = useAtom(agendaEntitiesAtom)

  const refreshEntities = useCallback(() => {
    if (settings.isInitialized === false) return Promise.resolve()
    return getAgendaEntities(settings).then(setEntities)
  }, [settings, setEntities])

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
    if (params.type === 'objective' || params.type === 'objective-status') {
      throw new Error('Objectives are not supported in the DB-only MVP')
    }

    const task = entities.find((entity) => entity.id === params.id)
    if (!task) {
      message.error('Entity not found')
      throw new Error('Entity not found')
    }

    switch (params.type) {
      case 'task':
        await updateTaskBlock(params.data)
        break
      case 'task-date':
        await updateBlockDateInfo({ ...params.data, uuid: params.id })
        break
      case 'task-status':
        await updateBlockTaskStatus(task, params.data)
        break
      case 'task-remove-date':
        await deleteBlockDateInfo(params.id)
        break
    }

    const updatedTask = await getDbAgendaEntity(params.id, settings)
    if (!updatedTask) {
      message.error('Failed to read updated DB task')
      throw new Error('Failed to read updated DB task')
    }
    setEntities((current) => current.map((entity) => (entity.id === params.id ? updatedTask : entity)))
    return updatedTask
  }

  const deleteEntity = async (id: string) => {
    await deleteEntityBlock(id)
    setEntities((current) => current.filter((entity) => entity.id !== id))
  }

  const addNewEntity = async (
    params:
      | { type: 'task'; data: CreateAgendaTask }
      | {
          type: 'objective'
          data: CreateObjectiveForm
        },
  ) => {
    if (params.type === 'objective') {
      throw new Error('Objectives are not supported in the DB-only MVP')
    }
    const block = await createTaskBlock(params.data)
    if (!block) {
      message.error('Failed to create DB task')
      throw new Error('Failed to create DB task')
    }
    const newTask = await getDbAgendaEntity(block.uuid, settings)
    if (!newTask) {
      message.error('Failed to read created DB task')
      throw new Error('Failed to read created DB task')
    }
    setEntities((current) => current.concat(newTask))
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
