import { Tabs, Typography } from 'antd'
import classNames from 'classnames'
import { useAtom } from 'jotai'
import { useParams } from 'react-router-dom'

import CalendarCom from '@/components/Calendar'
import { journalCalendarSchedulesAtom, projectCalendarSchedulesAtom } from '@/model/events'

import Gantt from './components/Gantt'
// import { scheduleCalendarMapAtom } from '@/model/schedule'
import ListView from './components/ListView'
import s from './index.module.less'

const Index = () => {
  const { projectId = '' } = useParams()
  const _projectId = decodeURIComponent(projectId)

  const [journalCalendarSchedules] = useAtom(journalCalendarSchedulesAtom)
  const [projectCalendarSchedules] = useAtom(projectCalendarSchedulesAtom)
  const calendarSchedules =
    _projectId === 'Journal'
      ? journalCalendarSchedules?.schedules
      : projectCalendarSchedules.find((item) => item?.calendarConfig?.id === _projectId)?.schedules || []

  return (
    <div className={classNames(s.page, 'page-container p-8 flex flex-col items-center')}>
      <Typography.Title level={3} className="title-text w-full">
        {_projectId}
      </Typography.Title>
      <div className="rounded-2xl flex w-full h-full p-6 bg-quaternary">
        {_projectId && (
          <Tabs className="w-full" tabPosition="left">
            <Tabs.TabPane tab="List" key="list">
              <ListView projectId={_projectId} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Calendar" key="calendar">
              <CalendarCom schedules={calendarSchedules} isProjectCalendar />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Gantt" key="gantt">
              <Gantt projectId={_projectId} mode="advanced" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Timeline" key="timeline">
              <Gantt projectId={_projectId} mode="simple" showSidebar={false} />
            </Tabs.TabPane>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default Index
