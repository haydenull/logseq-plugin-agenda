import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'

import { parseDurationString } from '@/Agenda3/helpers/block'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import { replaceTimeInfo } from '@/util/util'

export type CreateTaskForm = {
  title: string
  startDateVal: Dayjs
  endDateVal?: Dayjs
  startTime?: string
  estimatedTime?: string
  actualTime?: string
  projectId?: string
  bindObjectiveId?: string
}
const useCreate = (initialData: Partial<CreateTaskForm> | null) => {
  const { addNewEntity } = useAgendaEntities()
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
    return addNewEntity({
      type: 'task',
      data: {
        allDay,
        start,
        end: formData.endDateVal,
        title: formData.title,
        estimatedTime: formData.estimatedTime ? parseDurationString(formData.estimatedTime) : undefined,
        projectId: formData.projectId,
        bindObjectiveId: formData.bindObjectiveId,
      },
    })
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
