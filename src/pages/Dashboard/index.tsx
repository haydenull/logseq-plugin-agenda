import GaugeChart from '@/components/GaugeChart'
import Polygonal from '@/components/Polygonal'
import { ganttDataAtom } from '@/model/gantt'
import { IGroup } from '@/packages/Gantt/type'
import { categorizeTask, scheduleStartDayMap } from '@/util/schedule'
import classNames from 'classnames'
import dayjs, { Dayjs } from 'dayjs'
import { useAtom } from 'jotai'
import React, { useState } from 'react'
import { format, parse } from 'date-fns'
import Project from './components/Project'
import TaskLines from './components/TaskLines'
import s from './index.module.less'
import { SHOW_DATE_FORMAT } from '@/util/constants'
import { latest14DaysTasksAtom, todayTasksAtom } from '@/model/events'

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

function genLatest14PolygonalData() {
  const [latest14Tasks] = useAtom(latest14DaysTasksAtom)
  const tasksMap = scheduleStartDayMap(categorizeTask(latest14Tasks)?.done)
  const start = dayjs().subtract(13, 'day').startOf('day')
  const dateArr: Dayjs[] = [start]
  for (let i = 1; i < 14; i++) {
    dateArr.push(start.add(i, 'day'))
  }
  return dateArr.map((date) => {
    const tasks = tasksMap.get(date.format())
    return {
      date: date.format(),
      value: tasks?.length || 0,
    }
  })

}

const isDev = import.meta.env.DEV
const index: React.FC<{}> = () => {
  const polygonalData = isDev ? MOCK_POLYGONAL_DATA : genLatest14PolygonalData()

  const [projects] = useAtom(ganttDataAtom)
  const projectData = projects || []

  const [todayTasks] = useAtom(todayTasksAtom)
  const todayTaskMap = isDev ? { todo: [], doing: [], done: [] } : categorizeTask(todayTasks)
  const upcomingTasksCount = todayTaskMap?.todo?.length + todayTaskMap?.doing?.length
  const completedTasksCount = todayTaskMap?.done?.length
  const tasksAmount = upcomingTasksCount + completedTasksCount
  const progress = tasksAmount === 0 ? 0 : parseInt((completedTasksCount / tasksAmount) * 100 + '')

  const onClickTodayProgress = async () => {
    const { preferredDateFormat } = await logseq.App.getUserConfigs()
    const date = format(parse(dayjs().format('YYYY-MM-DD'), SHOW_DATE_FORMAT, new Date()), preferredDateFormat)
    logseq.App.pushState('page', { name: date })
    logseq.hideMainUI()
  }

  return (
    <div className="page-container flex">
      <div className={classNames(s.content, 'flex flex-col flex-1 p-8')}>
        <h1 className="title-text">Dashboard</h1>
        <div className="flex-1 overflow-auto">
          <div className={classNames(s.stats, 'flex')}>
            <div className="flex-1">
              <Polygonal data={polygonalData} />
            </div>
            <div style={{ width: '160px' }} className={classNames('h-full rounded-xl shadow-sm cursor-pointer', s.statsRight)} onClick={onClickTodayProgress}>
              <GaugeChart progress={progress} />
              <div className="flex justify-between px-6">
                <div className={classNames('flex flex-col rounded-lg text-center py-1 shadow-sm', s.amount)}>
                  <span className="text-3xl title-text">{upcomingTasksCount}</span>
                  <span className="text">Todo</span>
                </div>
                <div className={classNames('flex flex-col rounded-lg text-center py-1 shadow-sm', s.amount)}>
                  <span className="text-3xl title-text">{completedTasksCount}</span>
                  <span className="text">Done</span>
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
      </div>

      <div className={s.rightSide}>
        <TaskLines />
      </div>
    </div>
  )
}

export default index
