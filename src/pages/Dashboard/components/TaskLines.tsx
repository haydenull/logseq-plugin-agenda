import React, { useState } from 'react'
import { ISchedule } from 'tui-calendar'
import { RiExternalLinkLine } from 'react-icons/ri'

import s from '../index.module.less'
import classNames from 'classnames'
import dayjs from 'dayjs'
import Task from './Task'

const MOCK_TASKS: ISchedule[] = [
  { id: '111', title: 'foo', start: '2022-04-29T16:00', end: '2022-04-29T17:00', isAllDay: true, calendarId: 'overdule-journal', bgColor: '#aaa' },
  { id: '222', title: 'sdf', start: '2022-04-29T17:00', end: '2022-04-29T18:00', isAllDay: true, calendarId: 'journal', bgColor: '#aaa' },
  { id: 'eee', title: 'asdfa', start: '2022-04-29T17:20', end: '2022-04-29T19:00', isAllDay: false, calendarId: 'journal', bgColor: '#aaa' },
  { id: '444', title: 'foasdfaso', start: '2022-04-29T19:00', end: '2022-04-29T20:00', isAllDay: false, calendarId: 'journal', bgColor: '#aaa' },
  { id: '5', title: 'dgfd', start: '2022-04-29T20:00', end: '2022-05-01T21:00', isAllDay: false, calendarId: 'journal', bgColor: '#aaa' },
  { id: '6', title: 'dgfsd', start: '2022-04-29T21:00', end: '2022-04-29T22:00', isAllDay: false, calendarId: 'journal', bgColor: '#aaa' },
]

function categorizeTasks (tasks: ISchedule[]) {
  let overduleTasks: ISchedule[] = []
  let allDayTasks: ISchedule[] = []
  let timeTasks: ISchedule[] = []
  tasks.forEach(task => {
    if (task.calendarId?.startsWith('overdule-')) {
      overduleTasks.push(task)
    } else if (task.isAllDay) {
      allDayTasks.push(task)
    } else {
      timeTasks.push(task)
    }
  })

  return { overduleTasks, allDayTasks, timeTasks }
}

const TaskLines: React.FC<{}> = () => {
  const { overduleTasks, allDayTasks, timeTasks } = categorizeTasks(MOCK_TASKS)

  return (
    <div className={s.taskLine}>
      {
        overduleTasks.length > 0 && (
          <div className={s.module}>
            <span>Overdule</span>
            {
              overduleTasks.map(task => (
                <Task key={task.id} task={task} type="overdule" />
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
