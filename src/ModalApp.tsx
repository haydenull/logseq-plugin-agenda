import React, { useEffect, useState } from 'react'
import ModifySchedule, { IScheduleValue } from '@/components/ModifySchedule'
import TodayTaskModal from './components/TodayTaskModal'
import { useAtom } from 'jotai'
import { projectSchedulesAtom } from './model/schedule'
import { getInternalEvents, IEvent } from './util/events'
import { fullEventsAtom, journalEventsAtom, projectEventsAtom } from './model/events'
import PomodoroModal from './components/PomodoroModal'
import { ConfigProvider } from 'antd'
import { ANTD_THEME_CONFIG } from './util/constants'
import useTheme from './hooks/useTheme'

type IEditSchedule = {
  type: 'editSchedule'
  data: {
    initialValues?: IScheduleValue
    type?: 'create' | 'update'
  }
  showKeepRef?: boolean
}
type IInsertTodaySchedule = {
  type: 'insertTodaySchedule'
  data: {
    uuid: string
  }
}
type IPomodoroModal = {
  type: 'pomodoro'
  data: IEvent
}
export type IModalAppProps = IEditSchedule | IInsertTodaySchedule | IPomodoroModal
const ModalApp: React.FC<IModalAppProps> = (props) => {
  const theme = useTheme() || 'green'

  const [, setProjectSchedules] = useAtom(projectSchedulesAtom)
  const [, setFullEvents] = useAtom(fullEventsAtom)
  const [, setJournalEvents] = useAtom(journalEventsAtom)
  const [, setProjectEvents] = useAtom(projectEventsAtom)
  const type = props.type
  const onSave = () => { logseq.hideMainUI() }
  const onCancel = () => { logseq.hideMainUI() }

  useEffect(() => {
    async function fetchSchedules() {
      const res = await getInternalEvents()
      if (res) {
        const { fullEvents, journalEvents, projectEventsMap } = res
        setFullEvents(fullEvents)
        setJournalEvents(journalEvents)
        setProjectEvents(projectEventsMap)
      }
    }
    if (type === 'insertTodaySchedule') fetchSchedules()
  }, [type])

  return (
    <ConfigProvider
      theme={ANTD_THEME_CONFIG[theme]}
    >

      <div className="w-screen h-screen">
        {
          type === 'editSchedule' && (
            <ModifySchedule
              visible
              showKeepRef={props.showKeepRef}
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
        {
          type === 'pomodoro' && (
            <PomodoroModal
              visible
              data={props.data}
              onOk={onSave}
              onCancel={onCancel}
            />
          )
        }
      </div>
    </ConfigProvider>
  )
}

export default ModalApp
