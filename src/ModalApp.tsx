import React, { useState } from 'react'
import ModifySchedule, { IScheduleValue } from '@/components/ModifySchedule'

const ModalApp: React.FC<{
  initialValues?: IScheduleValue
  type?: 'create' | 'update'
}> = ({
  type,
  initialValues
}) => {
  const onSave = () => { logseq.hideMainUI() }
  const onCancel = () => { logseq.hideMainUI() }
  return (
    <div className="w-screen h-screen">
      <ModifySchedule
        visible
        type={type}
        initialValues={initialValues}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  )
}

export default ModalApp
