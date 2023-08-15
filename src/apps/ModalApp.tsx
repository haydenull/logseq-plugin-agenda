import { ConfigProvider } from 'antd'
import { useAtom } from 'jotai'
import React, { useEffect } from 'react'

import AddDailyLogModal from '@/components/AddDailyLogModal'
import ModifySchedule, { type IScheduleValue } from '@/components/ModifySchedule'
import PomodoroModal from '@/components/PomodoroModal'
import TodayTaskModal from '@/components/TodayTaskModal'
import useTheme from '@/hooks/useTheme'
import { fullEventsAtom, journalEventsAtom, projectEventsAtom } from '@/model/events'
import { projectSchedulesAtom } from '@/model/schedule'
import { ANTD_THEME_CONFIG } from '@/util/constants'
import { getInternalEvents, type IEvent } from '@/util/events'

export type ModalAppType = 'modifySchedule' | 'insertTodaySchedule' | 'pomodoro' | 'addDailyLog'

type IEditSchedule = {
  type: 'modifySchedule'
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
type IAddDailyLogModal = {
  type: 'addDailyLog'
}
export type IModalAppProps = IEditSchedule | IInsertTodaySchedule | IPomodoroModal | IAddDailyLogModal
const ModalApp: React.FC<IModalAppProps> = (props) => {
  const theme = useTheme() || 'green'

  const [, setProjectSchedules] = useAtom(projectSchedulesAtom)
  const [, setFullEvents] = useAtom(fullEventsAtom)
  const [, setJournalEvents] = useAtom(journalEventsAtom)
  const [, setProjectEvents] = useAtom(projectEventsAtom)
  const type = props.type
  const onSave = () => {
    logseq.hideMainUI()
  }
  const onCancel = () => {
    logseq.hideMainUI()
  }

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
    <ConfigProvider theme={ANTD_THEME_CONFIG[theme]}>
      <div className="w-screen h-screen">
        {type === 'modifySchedule' && (
          <ModifySchedule
            visible
            showKeepRef={props.showKeepRef}
            type={props.data.type}
            initialValues={props.data.initialValues}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}
        {type === 'insertTodaySchedule' && (
          <TodayTaskModal visible uuid={props.data.uuid} onSave={onSave} onCancel={onCancel} />
        )}
        {type === 'pomodoro' && <PomodoroModal visible data={props.data} onOk={onSave} onCancel={onCancel} />}
        {type === 'addDailyLog' && <AddDailyLogModal visible onCancel={onCancel} />}
      </div>
    </ConfigProvider>
  )
}

export default ModalApp
