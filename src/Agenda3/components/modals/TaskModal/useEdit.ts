import { message } from 'antd'
import dayjs, { isDayjs, type Dayjs } from 'dayjs'
import { useState } from 'react'
import { object, string, optional, special, type Output, safeParse, array, number } from 'valibot'

import { genDurationString, parseDurationString } from '@/Agenda3/helpers/block'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import type { AgendaEntity } from '@/types/entity'
import type { AgendaTaskWithStart } from '@/types/task'

import { genStart } from './useCreate'

const dayjsSchema = special<Dayjs>((input) => isDayjs(input))
const editFormSchema = object({
  title: string(),
  startDateVal: dayjsSchema,
  endDateVal: optional(dayjsSchema),
  startTime: optional(string()),
  estimatedTime: optional(string()),
  actualTime: optional(string()),
  timeLogs: optional(
    array(
      object({
        start: dayjsSchema,
        end: dayjsSchema,
        amount: number(),
      }),
    ),
  ),
  projectId: optional(string()),
  bindObjectiveId: optional(string()),
})
type EditTaskForm = Output<typeof editFormSchema>
type EditTaskFormNoValidation = Partial<EditTaskForm>
const useEdit = (initialTask: AgendaTaskWithStart | null) => {
  const { updateEntity } = useAgendaEntities()
  const initialFormData = {
    title: initialTask?.title || '',
    startDateVal: initialTask?.start,
    endDateVal: initialTask?.end,
    startTime: initialTask?.allDay ? undefined : dayjs(initialTask?.start).format('HH:mm'),
    estimatedTime: initialTask?.estimatedTime ? genDurationString(initialTask.estimatedTime) : undefined,
    actualTime: initialTask?.actualTime ? genDurationString(initialTask.actualTime) : undefined,
    timeLogs: initialTask?.timeLogs || [],
    projectId: initialTask?.project?.id,
    bindObjectiveId: initialTask?.bindObjectiveId,
  }
  const [formData, setFormData] = useState<EditTaskFormNoValidation>(initialFormData)

  const allDay = !formData.startTime
  const start = formData.startDateVal ? genStart(allDay, formData.startDateVal, formData.startTime) : undefined

  const updateFormData = (data: EditTaskFormNoValidation) => {
    setFormData((_data) => {
      const newData = {
        ..._data,
        ...data,
      }
      return {
        ...newData,
        actualTime: newData.timeLogs
          ? genDurationString(newData.timeLogs.reduce((acc, cur) => acc + cur.amount, 0))
          : undefined,
      }
    })
  }
  const reset = () => {
    setFormData(initialFormData)
  }
  const edit = async () => {
    const result = safeParse(editFormSchema, formData)
    if (!result.success || !initialTask) {
      message.error('Failed to edit task block')
      console.error('edit error', result)
      throw new Error('Failed to edit task block')
    }
    if (!start) return
    const estimatedTime = result.output.estimatedTime
    return updateEntity({
      type: 'task',
      id: initialTask.id,
      data: {
        ...initialTask,
        ...result.output,
        allDay,
        start,
        end: result.output.endDateVal,
        estimatedTime: estimatedTime ? parseDurationString(estimatedTime) : undefined,
        // actual time is generated from time logs
        actualTime: undefined,
        projectId: result.output.projectId,
      },
      // 因为这里必定有 start， 所以类型是 AgendaTaskWithStart
    }) as Promise<AgendaTaskWithStart>
  }

  return {
    formData,
    updateFormData,
    reset,
    edit,
    allDay,
    start,
  }
}

export default useEdit
