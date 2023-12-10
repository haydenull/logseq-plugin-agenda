import dayjs from 'dayjs'
import { useState } from 'react'

import { createObjectiveBlock } from '@/Agenda3/helpers/block'
import type { AgendaTaskObjective } from '@/types/objective'

export type CreateObjectiveForm = {
  title: string
  objective: AgendaTaskObjective
}

const useCreate = (initialData: Partial<CreateObjectiveForm> | null) => {
  const _initialData = initialData
    ? {
        title: initialData.title ?? '',
        objective:
          initialData.objective ??
          ({
            type: 'week',
            year: dayjs().year(),
            number: dayjs().week(),
          } as const),
      }
    : {
        title: '',
        objective: {
          type: 'week',
          year: dayjs().year(),
          number: dayjs().week(),
        } as const,
      }
  const [formData, setFormData] = useState<CreateObjectiveForm>(_initialData)

  const updateFormData = (data: Partial<CreateObjectiveForm>) => {
    setFormData((_data) => ({
      ..._data,
      ...data,
    }))
  }

  const create = async () => {
    const block = await createObjectiveBlock(formData)
    if (!block) {
      logseq.UI.showMsg('Failed to create objective block')
      throw new Error('Failed to create objective block')
    }
    return block
  }
  const reset = () => {
    setFormData(_initialData)
  }

  return { formData, updateFormData, create, reset }
}

export default useCreate
