import { notification } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtomValue } from 'jotai'
import { useState } from 'react'

import { createTaskBlock, parseDurationString, transformBlockToBlockFromQuery } from '@/Agenda3/helpers/block'
import { transformBlockToAgendaTask } from '@/Agenda3/helpers/task'
import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import { settingsAtom } from '@/Agenda3/models/settings'
import { replaceTimeInfo } from '@/util/util'

export type CreateTaskForm = {
  title: string
  startDateVal: Dayjs
  endDateVal?: Dayjs
  startTime?: string
  estimatedTime?: string
  actualTime?: string
  projectId?: string
}
const useCreate = (initialData: Partial<CreateTaskForm> | null) => {
  const settings = useAtomValue(settingsAtom)
  const { addNewTask } = useAgendaTasks()
  const _initialData = initialData
    ? {
        title: initialData.title ?? '',
        startDateVal: initialData.startDateVal ?? dayjs(),
        ...initialData,
      }
    : {
        title: '',
        startDateVal: dayjs(),
      }
  const [formData, setFormData] = useState<CreateTaskForm>(_initialData)

  const allDay = !formData.startTime
  const start = genStart(allDay, formData.startDateVal, formData.startTime)
  const updateFormData = (data: Partial<CreateTaskForm>) => {
    setFormData((_data) => ({
      ..._data,
      ...data,
    }))
  }
  const create = async () => {
    const block = await transformBlockToBlockFromQuery(
      await createTaskBlock({
        allDay,
        start,
        end: formData.endDateVal,
        title: formData.title,
        estimatedTime: formData.estimatedTime ? parseDurationString(formData.estimatedTime) : undefined,
        projectId: formData.projectId,
      }),
    )
    if (!block) {
      logseq.UI.showMsg('Failed to create task block')
      throw new Error('Failed to create task block')
    }
    const task = await transformBlockToAgendaTask(block, settings)
    const isFilterMode = (settings.selectedFilters || [])?.length > 0
    if (!isFilterMode || (isFilterMode && (task.filters ?? []).length > 0)) {
      addNewTask(task)
    } else {
      notification.info({
        message: 'Create successful but task is hidden',
        description: 'Task was hidden because it dose not match any of your filters.',
        duration: 0,
      })
    }
    return task
  }
  const reset = () => {
    setFormData(_initialData)
  }

  return { formData, allDay, start, updateFormData, create, reset }
}

export const genStart = (allDay: boolean, date: Dayjs, startTime?: string) => {
  return allDay ? date : replaceTimeInfo(date, dayjs(startTime, 'HH:mm'))
}

export default useCreate
