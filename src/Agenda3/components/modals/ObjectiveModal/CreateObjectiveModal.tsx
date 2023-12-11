import dayjs from 'dayjs'
import React from 'react'
import { useState } from 'react'

import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import type { AgendaTaskObjective } from '@/types/objective'

import { ObjectiveModal } from './BaseObjectiveModal'

export type CreateObjectiveForm = {
  title: string
  objective: AgendaTaskObjective
}
type CreateObjectiveModalProps = {
  children: React.ReactNode
  initialData: Partial<CreateObjectiveForm>
}
const CreateObjectiveModal = ({ children, initialData }: CreateObjectiveModalProps) => {
  const _initialData = {
    title: initialData.title ?? '',
    objective:
      initialData.objective ??
      ({
        type: 'week',
        year: dayjs().year(),
        number: dayjs().week(),
      } as const),
  }
  const [formData, setFormData] = useState<CreateObjectiveForm>(_initialData)

  const { addNewTask } = useAgendaTasks()

  const updateFormData = (data: Partial<CreateObjectiveForm>) => {
    setFormData((_data) => ({
      ..._data,
      ...data,
    }))
  }

  const create = async () => {
    return addNewTask({ type: 'objective', data: formData })
  }

  return (
    <ObjectiveModal type="create" formData={formData} updateFormData={updateFormData} action={create}>
      {children}
    </ObjectiveModal>
  )
}

export default CreateObjectiveModal
