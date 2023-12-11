import { Button, Input, Modal, Popconfirm } from 'antd'
import { useAtomValue } from 'jotai'
import React, { useState } from 'react'
import { BsCalendar4Event } from 'react-icons/bs'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { RiCheckboxBlankCircleLine, RiDeleteBin4Line } from 'react-icons/ri'

import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import { logseqAtom } from '@/Agenda3/models/logseq'
import type { AgendaObjective } from '@/types/objective'

import LogseqLogo from '../../icons/LogseqLogo'
import type { CreateTaskForm } from '../TaskModal/useCreate'
import { type CreateObjectiveForm } from './CreateObjectiveModal'
import { type EditObjectiveForm } from './EditObjectiveModal'
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
      initialObjective: AgendaObjective
      updateFormData: (data: Partial<EditObjectiveForm>) => void
      action: () => void
      onDelete: () => void
      onSwitchObjectiveStatus: (status: 'todo' | 'done') => void
    }

export const BaseObjectiveModal = (props: ObjectiveModalProps) => {
  const { children, formData, updateFormData, action, type } = props
  const { currentGraph } = useAtomValue(logseqAtom)
  const [open, setOpen] = useState(false)

  const handleCancel = () => {
    setOpen(false)
  }
  const handleOk = async () => {
    await action()
    setOpen(false)
  }
  const handleDelete = async () => {
    if (type === 'edit') {
      await props.onDelete()
      setOpen(false)
    }
  }
  const handleSwitchObjectiveStatus = async (status: 'todo' | 'done') => {
    if (type === 'edit') {
      await props.onSwitchObjectiveStatus(status)
      setOpen(false)
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Modal
        className="!w-[620px]"
        open={open}
        onCancel={handleCancel}
        onOk={handleOk}
        footer={
          <div className="flex items-center justify-between">
            <div>
              {type === 'edit' && props.initialObjective.status === 'todo' ? (
                <Button
                  className="inline-flex items-center px-2"
                  icon={<IoIosCheckmarkCircleOutline className="text-base" />}
                  onClick={() => handleSwitchObjectiveStatus('done')}
                >
                  Complete
                </Button>
              ) : null}
              {type === 'edit' && props.initialObjective.status === 'done' ? (
                <Button
                  className="inline-flex items-center px-2"
                  icon={<RiCheckboxBlankCircleLine />}
                  onClick={() => handleSwitchObjectiveStatus('todo')}
                >
                  Incomplete
                </Button>
              ) : null}
              {type === 'edit' ? (
                <Popconfirm
                  key="delete"
                  title="Delete the task"
                  description="Are you sure to delete this task?"
                  onConfirm={handleDelete}
                >
                  <Button
                    className="inline-flex items-center px-2 hover:!border-red-500 hover:!text-red-500"
                    icon={<RiDeleteBin4Line />}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              ) : null}
              {type === 'edit' ? (
                <Button
                  className="inline-flex items-center justify-center text-gray-400"
                  shape="circle"
                  icon={<LogseqLogo />}
                  onClick={() => {
                    navToLogseqBlock(props.initialObjective, currentGraph)
                    setOpen(false)
                  }}
                />
              ) : null}
            </div>
            <div>
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>
              <Button key="ok" type="primary" onClick={handleOk}>
                {type === 'create' ? 'Add Objective' : 'Save'}
              </Button>
            </div>
          </div>
        }
      >
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
            <PeriodPicker initialValue={formData?.objective} onChange={(o) => updateFormData({ objective: o })} />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default BaseObjectiveModal
