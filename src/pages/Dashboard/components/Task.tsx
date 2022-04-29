import classNames from 'classnames'
import React, { useState } from 'react'
import { RiExternalLinkLine } from 'react-icons/ri'
import type { ISchedule } from 'tui-calendar'
import dayjs from 'dayjs'
import s from '../index.module.less'

const Task: React.FC<{
  task: ISchedule
  showTimeDot?: boolean
  type?: 'overdule' | 'allDay' | 'time'
}> = ({ task, showTimeDot = false, type = 'allDay' }) => {
  // @ts-ignore
  const isActive = dayjs().isBetween(dayjs(task.start), dayjs(task.end))
  return (
    <div className={classNames(s.task, { [s.taskActive]: isActive }, s?.[type], 'flex pl-5 pr-4 py-2 items-center justify-between')}>
      {/* @ts-ignore */}
      { showTimeDot && <div className={classNames(s.time)}><span>{dayjs(task.start)?.format('HH:mm')}</span></div> }
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: task.bgColor }}>{task?.calendarId?.[0]?.toUpperCase()}</div>
      <div className="flex flex-col flex-1 ellipsis mx-4">
        <span className="ellipsis">{task.title}</span>
        <div className={classNames(s.subscription, 'text-xs ellipsis')}>
          <span>{task.start}-{task?.end}</span>
          <span>{task.calendarId}</span>
        </div>
      </div>
      <div className="w-5 h-5"><RiExternalLinkLine /></div>
    </div>
  )
}

export default Task
