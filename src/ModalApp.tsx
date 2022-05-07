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
    <ModifySchedule
      visible
      type={type}
      initialValues={initialValues}
      onSave={onSave}
      onCancel={onCancel}
    />
  )
}

export default ModalApp
