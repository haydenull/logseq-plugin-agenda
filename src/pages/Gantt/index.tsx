import React, { useState } from 'react'
import Gantt from '@/packages/Gantt'
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
      <h1>Gantt</h1>
      <div className={classNames(s.contentWrapper)}>
        {
          projectData.map(project => {
            return (<GanttCom project={project} />)
          })
        }
      </div>
    </div>
  )
}

export default index
