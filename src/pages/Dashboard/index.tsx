import Polygonal from '@/components/Polygonal'
import { IGroup } from '@/packages/Gantt/type'
import classNames from 'classnames'
import React, { useState } from 'react'
import Project from './components/Project'
import TaskLines from './components/TaskLines'

import s from './index.module.less'

const MOCK_PROJECTS: IGroup[] = [
 { id: '111', title: 'project1', events: [], milestones: [] },
 { id: '222', title: 'project1', events: [], milestones: [] },
 { id: '333', title: 'project1', events: [], milestones: [] },
]

const index: React.FC<{}> = () => {
  const projectData = MOCK_PROJECTS
  return (
    <div className="page-container flex">
      <div className={classNames(s.content, 'flex flex-col flex-1 p-8 overflow-auto')}>
        <h1 className="sticky top-0">Dashboard</h1>
        <div className={s.stats}>
          <Polygonal />
        </div>

        <div className={s.projects}>
          {
            projectData.map(project => (
              <Project key={project.id} data={project} />
            ))
          }
        </div>
      </div>

      <div className={s.rightSide}>
        <TaskLines />
      </div>
    </div>
  )
}

export default index
