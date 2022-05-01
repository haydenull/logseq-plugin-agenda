import GaugeChart from '@/components/GaugeChart'
import Polygonal from '@/components/Polygonal'
import { IGroup } from '@/packages/Gantt/type'
import classNames from 'classnames'
import React, { useState } from 'react'
import Project from './components/Project'
import TaskLines from './components/TaskLines'

import s from './index.module.less'

const MOCK_PROJECTS: IGroup[] = [
 { id: '111', title: 'project1', events: [], milestones: [ {start: '2022-05-03', end: '2022-05-03', title: 'milesttttsfasfsadfasffdasf', 'id': 'xxx'} ], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
 { id: '222', title: 'project1', events: [], milestones: [], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
 { id: '333', title: 'project1', events: [], milestones: [], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
]
const MOCK_POLYGONAL_DATA: { date: string; value: number }[] = [
  { date: '2020-04-26', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-04-27', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-04-28', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-04-29', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-04-30', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-01', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-02', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-03', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-04', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-05', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-06', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-07', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-08', value: parseInt(Math.random() * 30 + '') },
  { date: '2020-05-09', value: parseInt(Math.random() * 30 + '') },
]

const index: React.FC<{}> = () => {
  const projectData = MOCK_PROJECTS
  return (
    <div className="page-container flex">
      <div className={classNames(s.content, 'flex flex-col flex-1 p-8 overflow-auto')}>
        <h1 className="sticky top-0">Dashboard</h1>
        <div className={classNames(s.stats, 'flex')}>
          <div className="flex-1">
            <Polygonal data={MOCK_POLYGONAL_DATA} />
          </div>
          <div style={{ width: '160px' }} className={classNames('h-full rounded-xl shadow-sm', s.statsRight)}>
            <GaugeChart progress={parseInt(Math.random() * 100 + '')} />
            <div className="flex justify-between px-6">
              <div className={classNames('flex flex-col rounded-lg text-center py-1 shadow-sm', s.amount)}>
                <span className="text-3xl">16</span>
                <span className="text-gray-500">Todo</span>
              </div>
              <div className={classNames('flex flex-col rounded-lg text-center py-1 shadow-sm', s.amount)}>
                <span className="text-3xl">1</span>
                <span className="text-gray-500">Done</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
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
