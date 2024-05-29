import type { MessageInstance } from 'antd/es/message/interface'
import dayjs, { isDayjs, type Dayjs } from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { object, string, optional, special, type Output, safeParse, array, number, union } from 'valibot'

import { genDurationString, parseDurationString } from '@/Agenda3/helpers/block'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import type { AgendaEntityDeadline } from '@/types/entity'
import type { AgendaTaskWithStartOrDeadline } from '@/types/task'

import { genStart } from './useCreate'

const DayjsSchema = special<Dayjs>((input) => isDayjs(input))
const BaseFormSchema = object({
  title: string(),
  endDateVal: optional(DayjsSchema),
  startTime: optional(string()),
  deadlineTime: optional(string()),
  estimatedTime: optional(string()),
  actualTime: optional(string()),
  timeLogs: optional(
    array(
      object({
        start: DayjsSchema,
        end: DayjsSchema,
        amount: number(),
      }),
    ),
  ),
  projectId: optional(string()),
  bindObjectiveId: optional(string()),
})
const StartFormSchema = object({
  ...BaseFormSchema.entries,
  startDateVal: DayjsSchema,
  deadlineDateVal: optional(DayjsSchema),
})
const DeadlineFormSchema = object({
  ...BaseFormSchema.entries,
  startDateVal: optional(DayjsSchema),
  deadlineDateVal: DayjsSchema,
})
const EditFormSchema = union([StartFormSchema, DeadlineFormSchema])
type EditTaskForm = Output<typeof EditFormSchema>
type EditTaskFormNoValidation = Partial<EditTaskForm>
const useEdit = (initialTask: AgendaTaskWithStartOrDeadline | null, messageApi: MessageInstance) => {
  const { t } = useTranslation()
  const { updateEntity } = useAgendaEntities()
  const initialFormData = {
    title: initialTask?.title || '',
    startDateVal: initialTask?.start,
    endDateVal: initialTask?.end,
    deadlineDateVal: initialTask?.deadline?.value,
    deadlineTime: initialTask?.deadline?.allDay ? undefined : dayjs(initialTask?.deadline?.value).format('HH:mm'),
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
  const deadline = formData.deadlineDateVal
    ? ({
        value: genStart(!formData.deadlineTime, formData.deadlineDateVal, formData.deadlineTime),
        allDay: !formData.deadlineTime,
      } satisfies AgendaEntityDeadline)
    : undefined

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
    // start 与 deadline 不能同时为空
    if (!start && !deadline) {
      const message = t('Pleasse specify start or deadline')
      messageApi.error(message)
      throw new Error(message)
    }
    if (formData.title?.trim()?.length === 0) {
      const message = t('Title cannot be empty')
      messageApi.error(message)
      throw new Error(message)
    }
    const result = safeParse(EditFormSchema, formData)
    if (!result.success || !initialTask) {
      messageApi.error('Failed to edit task block')
      console.error('Failed to edit task block', result)
      throw new Error('Failed to edit task block')
    }
    const estimatedTime = result.output.estimatedTime
    return updateEntity({
      type: 'task',
      id: initialTask.id,
      data: {
        ...initialTask,
        ...result.output,
        allDay,
        // start 与 deadline 不能同时为空
        start,
        deadline: deadline as AgendaEntityDeadline,
        end: result.output.endDateVal,
        estimatedTime: estimatedTime ? parseDurationString(estimatedTime) : undefined,
        // actual time is generated from time logs
        actualTime: undefined,
        projectId: result.output.projectId,
      },
    }) as Promise<AgendaTaskWithStartOrDeadline>
  }

  return {
    formData,
    updateFormData,
    reset,
    edit,
    allDay,
    start,
    deadline,
  }
}

export default useEdit
