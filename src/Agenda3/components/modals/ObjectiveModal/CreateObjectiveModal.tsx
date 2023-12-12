/**
 * 创建目标的弹窗
 * 基于 BaseObjectiveModal 组件
 */
import dayjs from 'dayjs'
import React from 'react'
import { useState } from 'react'

import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import type { AgendaEntityObjective } from '@/types/objective'

import { BaseObjectiveModal } from './BaseObjectiveModal'

export type CreateObjectiveForm = {
  title: string
  objective: AgendaEntityObjective
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

  const { addNewEntity } = useAgendaEntities()

  const updateFormData = (data: Partial<CreateObjectiveForm>) => {
    setFormData((_data) => ({
      ..._data,
      ...data,
    }))
  }

  const create = async () => {
    return addNewEntity({ type: 'objective', data: formData })
  }

  return (
    <BaseObjectiveModal type="create" formData={formData} updateFormData={updateFormData} action={create}>
      {children}
    </BaseObjectiveModal>
  )
}

export default CreateObjectiveModal
