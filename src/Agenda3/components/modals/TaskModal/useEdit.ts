import { message, notification } from 'antd'
import dayjs, { isDayjs, type Dayjs } from 'dayjs'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { object, string, optional, special, type Output, safeParse, array, number } from 'valibot'

import {
  genDurationString,
  parseDurationString,
  transformBlockToBlockFromQuery,
  updateTaskBlock,
} from '@/Agenda3/helpers/block'
import { transformBlockToAgendaTask } from '@/Agenda3/helpers/task'
import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import { settingsAtom } from '@/Agenda3/models/settings'
import type { AgendaTask } from '@/types/task'

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
})
type EditTaskForm = Output<typeof editFormSchema>
type EditTaskFormNoValidation = Partial<EditTaskForm>
const useEdit = (initialTask: AgendaTask | null) => {
  const settings = useAtomValue(settingsAtom)
  const { updateTask } = useAgendaTasks()
  const initialFormData = {
    title: initialTask?.title || '',
    startDateVal: initialTask?.start,
    endDateVal: initialTask?.end,
    startTime: initialTask?.allDay ? undefined : dayjs(initialTask?.start).format('HH:mm'),
    estimatedTime: initialTask?.estimatedTime ? genDurationString(initialTask.estimatedTime) : undefined,
    actualTime: initialTask?.actualTime ? genDurationString(initialTask.actualTime) : undefined,
    timeLogs: initialTask?.timeLogs || [],
    projectId: initialTask?.project?.id,
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
    const estimatedTime = result.output.estimatedTime
    return updateTask({
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
    })
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
