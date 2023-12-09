import { Input, Modal } from 'antd'
import React, { useState } from 'react'
import { BsCalendar4Event } from 'react-icons/bs'

import type { CreateTaskForm } from '../TaskModal/useCreate'
import { type CreateObjectiveForm } from './CreateObjectiveModal/useCreate'
import { type EditObjectiveForm } from './EditObjectiveModal/useEdit'
import PeriodPicker from './PeriodPicker'

type ObjectiveModalProps =
  | {
      type: 'create'
      children: React.ReactNode
      formData: Partial<CreateObjectiveForm>
      updateFormData: (data: Partial<CreateTaskForm>) => void
      action: () => void
    }
  | {
      type: 'edit'
      children: React.ReactNode
      formData: EditObjectiveForm
      updateFormData: (data: Partial<EditObjectiveForm>) => void
      action: () => void
    }

export const ObjectiveModal = ({ children, formData, updateFormData, action }: ObjectiveModalProps) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Modal className="!w-[620px]" open={open} onCancel={() => setOpen(false)}>
        <Input
          className="!border-0 !px-0 !text-2xl !shadow-none"
          placeholder="Objective Title"
          value={formData?.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
        />
        <div className="my-2 flex">
          <div className="flex w-[160px] items-center gap-1 text-gray-400">
            <BsCalendar4Event /> Period
          </div>
          <div className="flex items-center gap-1">
            <PeriodPicker initialValue={formData?.objective} />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ObjectiveModal
