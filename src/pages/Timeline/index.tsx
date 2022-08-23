import React, { useState } from 'react'
import Gantt from '@/packages/Gantt'
import classNames from 'classnames'
import { useAtom } from 'jotai'
import { ganttDataAtom } from '@/model/gantt'

import s from './index.module.less'
import Timeline from './components/Timeline'

const index: React.FC<{}> = () => {
  const [ganttData] = useAtom(ganttDataAtom)
  const projectData = ganttData || []

  return (
    <div className="page-container p-8 flex flex-col">
      <h1 className="title-text">Timeline</h1>
      <div className={classNames(s.contentWrapper, 'shadow rounded-2xl')}>
        <Timeline projects={projectData} />
      </div>
    </div>
  )
}

export default index
