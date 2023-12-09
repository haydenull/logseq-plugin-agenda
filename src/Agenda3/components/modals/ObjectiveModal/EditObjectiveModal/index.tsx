import React from 'react'

import type { AgendaObjective } from '@/types/objective'

import { ObjectiveModal } from '../BaseObjectiveModal'
import useEdit from './useEdit'

type EditObjectiveModalProps = {
  children: React.ReactNode
  initialData: AgendaObjective
}
const EditObjectiveModal = ({ children, initialData }: EditObjectiveModalProps) => {
  const { formData, updateFormData, edit } = useEdit(initialData)

  return (
    <ObjectiveModal type="edit" formData={formData} updateFormData={updateFormData} action={edit}>
      {children}
    </ObjectiveModal>
  )
}

export default EditObjectiveModal
