import type { MessageInstance } from 'antd/es/message/interface'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { parseDurationString } from '@/Agenda3/helpers/block'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import type { AgendaEntityDeadline } from '@/types/entity'
import { replaceTimeInfo } from '@/util/util'

type BaseCreateTaskForm = {
  title: string
  startDateVal?: Dayjs
  endDateVal?: Dayjs
  deadlineDateVal?: Dayjs
  startTime?: string
  deadlineTime?: string
  estimatedTime?: string
  actualTime?: string
  projectId?: string
  bindObjectiveId?: string
}
export type CreateTaskForm =
  | (BaseCreateTaskForm & {
      startDateVal: Dayjs
    })
  | (BaseCreateTaskForm & {
      endDateVal: Dayjs
    })
const useCreate = (initialData: Partial<CreateTaskForm> | null, messageApi: MessageInstance) => {
  const { t } = useTranslation()
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
  const start = formData.startDateVal ? genStart(allDay, formData.startDateVal, formData.startTime) : undefined
  const deadline = formData.deadlineDateVal
    ? ({
        value: genStart(!formData.deadlineTime, formData.deadlineDateVal, formData.deadlineTime),
        allDay: !formData.deadlineTime,
      } satisfies AgendaEntityDeadline)
    : undefined
  const updateFormData = (data: Partial<CreateTaskForm>) => {
    setFormData((_data) => ({
      ..._data,
      ...data,
    }))
  }
  const create = async () => {
    if (!start && !deadline) {
      return messageApi.error(t('Pleasse specify start or deadline'))
    }
    return addNewEntity({
      type: 'task',
      data: {
        allDay,
        start,
        deadline,
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

  return { formData, allDay, start, deadline, updateFormData, create, reset }
}

export const genStart = (allDay: boolean, date: Dayjs, startTime?: string) => {
  return allDay ? date : replaceTimeInfo(date, dayjs(startTime, 'HH:mm'))
}

export default useCreate
