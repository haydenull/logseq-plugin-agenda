import React from 'react'
import { useState } from 'react'
import { type Output, number, object, string, picklist } from 'valibot'

import type { AgendaObjective } from '@/types/objective'

import { ObjectiveModal } from './BaseObjectiveModal'

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

  const updateFormData = (data: Partial<EditObjectiveForm>) => {
    setFormData((_data) => ({
      ..._data,
      ...data,
    }))
  }

  const edit = async () => {
    // const block = await editObjectiveBlock({
    //   title: formData.title,
    //   period: formData.period,
    // })
    // if (!block) {
    //   logseq.UI.showMsg('Failed to create objective block')
    //   throw new Error('Failed to create objective block')
    // }
    // return block
  }
  const reset = () => {
    setFormData(_initialData)
  }

  return (
    <ObjectiveModal type="edit" formData={formData} updateFormData={updateFormData} action={edit}>
      {children}
    </ObjectiveModal>
  )
}

export default EditObjectiveModal
