import React, { useState } from 'react'
import classNames from 'classnames'
import { useAtom } from 'jotai'
import Gantt from './components/Gantt'

import s from './index.module.less'
import { Tabs } from 'antd'
import { useParams } from 'react-router-dom'
import CalendarCom from '@/components/Calendar'
import { schedulesAtom } from '@/model/schedule'

const index: React.FC<{}> = () => {
  const { projectId } = useParams()

  const [allCalendarSchedules] = useAtom(schedulesAtom)
  const calendarSchedules = allCalendarSchedules.filter(item => item.calendarId === projectId)

  return (
    <div className={classNames(s.page, 'page-container p-8 flex flex-col items-center')}>
      <h1 className="title-text w-full">{projectId}</h1>
      <div className="rounded-2xl flex w-full h-full p-6 bg-quaternary">
        {
          projectId && (
            <Tabs className="w-full" tabPosition="left">
              <Tabs.TabPane tab="Calendar" key="calendar">
                <CalendarCom schedules={calendarSchedules} isProjectCalendar />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Gantt" key="gantt">
                <Gantt projectId={projectId} mode="advanced" />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Timeline" key="timeline">
                <Gantt projectId={projectId} mode="simple" />
              </Tabs.TabPane>
            </Tabs>
          )
        }
      </div>
    </div>
  )
}

export default index
