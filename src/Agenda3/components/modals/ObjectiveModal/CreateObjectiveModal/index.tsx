import React from 'react'

import { ObjectiveModal } from '../BaseObjectiveModal'
import useCreate, { type CreateObjectiveForm } from './useCreate'

type CreateObjectiveModalProps = {
  children: React.ReactNode
  initialData: Partial<CreateObjectiveForm>
}
const CreateObjectiveModal = ({ children, initialData }: CreateObjectiveModalProps) => {
  const { formData, updateFormData, create } = useCreate(initialData)

  return (
    <ObjectiveModal type="create" formData={formData} updateFormData={updateFormData} action={create}>
      {children}
    </ObjectiveModal>
  )
}

export default CreateObjectiveModal
