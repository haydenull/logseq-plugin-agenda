import classNames from 'classnames'
import React, { useState } from 'react'
import { RiExternalLinkLine } from 'react-icons/ri'
import type { ISchedule } from 'tui-calendar'
import dayjs from 'dayjs'
import { getPageData } from '@/util/logseq'
import s from '../index.module.less'

function getTime(task: ISchedule) {
  const startDay = dayjs(task.start as string)
  const endDay = dayjs(task.end as string)
  const isSameDay = startDay.isSame(endDay, 'day')
  if (task.isAllDay) {
    if (isSameDay) return 'All Day'
    return `${startDay.format('MMM DD')} - ${endDay.format('MMM DD')}`
  } else {
    if (isSameDay) return `${startDay.format('HH:mm')} - ${endDay.format('HH:mm')}`
    return `${startDay.format('MMM DD HH:mm')} - ${endDay.format('MMM DD HH:mm')}`
  }
}

const Task: React.FC<{
  task: ISchedule
  showTimeDot?: boolean
  type?: 'overdue' | 'allDay' | 'time'
}> = ({ task, showTimeDot = false, type = 'allDay' }) => {
  const startDay = dayjs(task.start as string)
  const endDay = dayjs(task.end as string)
  const timeFormatter = startDay.isSame(endDay, 'day') ? 'HH:mm' : 'HH:mm (ddd)'
  const isActive = type !== 'overdue' && dayjs().isBetween(startDay, endDay)
  return (
    <div className={classNames(s.task, { [s.taskActive]: isActive }, s?.[type], 'flex pl-5 pr-4 py-2 items-center justify-between')}>
      { showTimeDot && <div className={classNames(s.time)}><span>{startDay?.format('HH:mm')}</span></div> }
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: task.bgColor, color: task.color }} title={task.calendarId}>{task?.calendarId?.[0]?.toUpperCase()}</div>
      <div className="flex flex-col flex-1 ellipsis mx-4">
        <span className="ellipsis text">{task.title}</span>
        <div className={classNames(s.subscription, 'text-xs flex justify-between')}>
          <span className="description-text">{getTime(task)}</span>
          <span className="ml-2 ellipsis #6b531a" title={task.calendarId}>{task.calendarId}</span>
        </div>
      </div>
      <div className="w-5 h-5 cursor-pointer text" onClick={async () => {
        const rawData: any = task.raw
        const { id: pageId, originalName } = rawData?.page || {}
        let pageName = originalName
        // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
        if (!pageName) {
          const page = await getPageData({ id: pageId })
          pageName = page?.originalName
        }
        const { uuid: blockUuid } = await logseq.Editor.getBlock(rawData.id) || { uuid: '' }
        logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
        logseq.hideMainUI()
      }}><RiExternalLinkLine /></div>
    </div>
  )
}

export default Task
