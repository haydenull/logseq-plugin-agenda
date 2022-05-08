import React, { useEffect, useState } from 'react'
import ModifySchedule, { IScheduleValue } from '@/components/ModifySchedule'
import { listenEsc, managePluginTheme } from './util/util'

const ModalApp: React.FC<{
  initialValues?: IScheduleValue
  type?: 'create' | 'update'
}> = ({
  type,
  initialValues
}) => {
  const onSave = () => { logseq.hideMainUI() }
  const onCancel = () => { logseq.hideMainUI() }

  useEffect(() => {
    const callback = () => logseq.hideMainUI()
    listenEsc(callback)
    managePluginTheme()
    return () => {
      document.removeEventListener('keyup', callback)
    }
  }, [])

  return (
    <div className="w-screen h-screen">
      <ModifySchedule
        visible
        showKeepRef
        type={type}
        initialValues={initialValues}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  )
}

export default ModalApp
