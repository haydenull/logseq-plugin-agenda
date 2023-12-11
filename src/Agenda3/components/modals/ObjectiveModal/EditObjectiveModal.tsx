import React from 'react'
import { useState } from 'react'
import { type Output, number, object, string, picklist } from 'valibot'

import { updateBlockTaskStatus } from '@/Agenda3/helpers/block'
import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import type { AgendaObjective } from '@/types/objective'

import { BaseObjectiveModal } from './BaseObjectiveModal'

const editFormSchema = object({
  title: string(),
  objective: object({
    type: picklist(['week', 'month']),
    year: number(),
    number: number(),
  }),
})
export type EditObjectiveForm = Output<typeof editFormSchema>

type EditObjectiveModalProps = {
  children: React.ReactNode
  initialData: AgendaObjective
}
const EditObjectiveModal = ({ children, initialData }: EditObjectiveModalProps) => {
  const _initialData = { title: initialData.title, objective: initialData.objective }
  const [formData, setFormData] = useState<EditObjectiveForm>(_initialData)

  const { updateTask, deleteTask } = useAgendaTasks()

  const updateFormData = (data: Partial<EditObjectiveForm>) => {
    setFormData((_data) => ({
      ..._data,
      ...data,
    }))
  }
  const edit = async () => {
    return updateTask({
      type: 'objective',
      id: initialData.id,
      data: formData,
    })
  }
  const handleDelete = () => {
    deleteTask(initialData.id)
  }
  const handleSwitchStatus = async (status: 'todo' | 'done') => {
    return updateTask({
      type: 'objective-status',
      id: initialData.id,
      data: status,
    })
  }

  return (
    <BaseObjectiveModal
      type="edit"
      initialObjective={initialData}
      formData={formData}
      updateFormData={updateFormData}
      action={edit}
      onDelete={handleDelete}
      onSwitchObjectiveStatus={handleSwitchStatus}
    >
      {children}
    </BaseObjectiveModal>
  )
}

export default EditObjectiveModal
