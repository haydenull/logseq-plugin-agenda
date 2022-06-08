import React, { useState } from 'react'
import { ISchedule } from 'tui-calendar'
import { RiExternalLinkLine } from 'react-icons/ri'

import s from '../index.module.less'
import classNames from 'classnames'
import dayjs from 'dayjs'
import Task from './Task'
import { useAtom } from 'jotai'
import { todayTasksAtom } from '@/model/events'
import { categorizeTasks } from '@/util/schedule'

const MOCK_TASKS: ISchedule[] = [
  { id: '111', title: 'foo', start: '2022-05-01T16:00', end: '2022-05-01T17:00', isAllDay: true, calendarId: 'overdue-journal', bgColor: '#aaa' },
  { id: '222', title: 'sdf', start: '2022-05-01T17:00', end: '2022-05-01T18:00', isAllDay: true, calendarId: 'journal', bgColor: '#aaa' },
  { id: 'eee', title: 'asdfa', start: '2022-05-01T17:20', end: '2022-05-01T19:00', isAllDay: false, calendarId: 'journal', bgColor: '#aaa' },
  { id: '444', title: 'foasdfaso', start: '2022-05-01T19:00', end: '2022-05-01T20:00', isAllDay: false, calendarId: 'journal', bgColor: '#aaa' },
  { id: '5', title: 'dgfd', start: '2022-05-01T20:00', end: '2022-05-01T21:00', isAllDay: false, calendarId: 'journal', bgColor: '#aaa' },
  { id: '6', title: 'dgfsd', start: '2022-05-01T22:00', end: '2022-05-01T23:00', isAllDay: false, calendarId: 'journal', bgColor: '#aaa' },
]

const TaskLines: React.FC<{}> = () => {
  const [todayTasks] = useAtom(todayTasksAtom)
  const { overdueTasks, allDayTasks, timeTasks } = categorizeTasks(todayTasks)

  return (
    <div className={s.taskLine}>
      {
        overdueTasks.length > 0 && (
          <div className={s.module}>
            <span>Overdue</span>
            {
              overdueTasks.map(task => (
                <Task key={task.id} task={task} type="overdue" />
              ))
            }
          </div>
        )
      }
      {
        allDayTasks.length > 0 && (
          <div className={s.module}>
            <span>All Day</span>
            {
              allDayTasks.map(task => (
                <Task key={task.id} task={task} type="allDay" />
              ))
            }
          </div>
        )
      }
      {
        timeTasks.length > 0 && (
          <div className={s.module}>
            <span>Time</span>
            {
              timeTasks.map(task => (
                <Task key={task.id} task={task} type="time" showTimeDot />
              ))
            }
          </div>
        )
      }
    </div>
  )
}

export default TaskLines
