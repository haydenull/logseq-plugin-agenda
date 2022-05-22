import React, { useState } from 'react'
import classNames from 'classnames'
import { useAtom } from 'jotai'
import { ganttDataAtom } from '@/model/gantt'
import Calendar from '@/pages/Calendar'
import Gantt from './components/Gantt'

import s from './index.module.less'
import { Tabs } from 'antd'
import { useParams } from 'react-router-dom'

const index: React.FC<{}> = () => {
  const { projectId } = useParams()

  return (
    <div className={classNames(s.page, 'page-container p-8 flex flex-col items-center')}>
      <h1 className="title-text w-full">{projectId}</h1>
      <div className="rounded-2xl flex w-full h-full p-8 bg-quaternary">
        {
          projectId && (
            <Tabs className="w-full">
              <Tabs.TabPane tab="Calendar" key="calendar">
                <Calendar />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Timeline" key="timeline">
              <Gantt projectId={projectId} mode="simple" />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Gantt" key="gantt">
                <Gantt projectId={projectId} mode="advanced" />
              </Tabs.TabPane>
            </Tabs>
          )
        }
      </div>
    </div>
  )
}

export default index
