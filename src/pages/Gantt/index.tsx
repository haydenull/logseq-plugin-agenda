import React, { useState } from 'react'
import classNames from 'classnames'
import { useAtom } from 'jotai'
import { ganttDataAtom } from '@/model/gantt'

import s from './index.module.less'
import GanttCom from './components/Gantt'

const index: React.FC<{}> = () => {
  const [ganttData] = useAtom(ganttDataAtom)
  const projectData = ganttData || []

  return (
    <div className="page-container p-8 flex flex-col">
      <h1 className="title-text">Gantt</h1>
      <div className={classNames(s.contentWrapper, 'shadow rounded-2xl')}>
        <GanttCom projects={projectData} />
      </div>
    </div>
  )
}

export default index
