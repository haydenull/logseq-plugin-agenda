import React, { useEffect, useState } from 'react'
import ModifySchedule, { IScheduleValue } from '@/components/ModifySchedule'
import { listenEsc, managePluginTheme } from './util/util'
import TodayTaskModal from './components/TodayTaskModal'

type IEditSchedule = {
  type: 'editSchedule'
  data: {
    initialValues?: IScheduleValue
    type?: 'create' | 'update'
  }
}
type IInsertTodaySchedule = {
  type: 'insertTodaySchedule'
  data: {
    uuid: string
  }
}
export type IModalAppProps = IEditSchedule | IInsertTodaySchedule
const ModalApp: React.FC<IModalAppProps> = (props) => {
  const type = props.type
  const onSave = () => { logseq.hideMainUI() }
  const onCancel = () => { logseq.hideMainUI() }

  // {
  //   type,
  //   initialValues
  // }

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
      {
        type === 'editSchedule' && (
          <ModifySchedule
            visible
            showKeepRef
            type={props.data.type}
            initialValues={props.data.initialValues}
            onSave={onSave}
            onCancel={onCancel}
          />
        )
      }
      {
        type === 'insertTodaySchedule' && (
          <TodayTaskModal
            visible
            uuid={props.data.uuid}
            onSave={onSave}
            onCancel={onCancel}
          />
        )
      }
    </div>
  )
}

export default ModalApp
