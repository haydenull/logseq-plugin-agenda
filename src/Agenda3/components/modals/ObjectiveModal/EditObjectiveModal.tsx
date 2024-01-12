import React from 'react'
import { useState } from 'react'
import { type Output, number, object, string, picklist } from 'valibot'

import { updateBlockTaskStatus } from '@/Agenda3/helpers/block'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
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

  const { updateEntity, deleteEntity } = useAgendaEntities()

  const updateFormData = (data: Partial<EditObjectiveForm>) => {
    console.log('[faiz:] === updateFormData', data)
    setFormData((_data) => ({
      ..._data,
      ...data,
    }))
  }
  const edit = async () => {
    return updateEntity({
      type: 'objective',
      id: initialData.id,
      data: formData,
    })
  }
  const handleDelete = () => {
    deleteEntity(initialData.id)
  }
  const handleSwitchStatus = async (status: 'todo' | 'done') => {
    return updateEntity({
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
