import classNames from 'classnames'
import React, { useState } from 'react'
import { RiExternalLinkLine } from 'react-icons/ri'
import { GrAddCircle } from 'react-icons/gr'
import type { ISchedule } from 'tui-calendar'
import dayjs from 'dayjs'
import { getPageData, moveBlockToNewPage, moveBlockToSpecificBlock } from '@/util/logseq'
import { format } from 'date-fns'
import { ISettingsForm } from '@/util/type'

function getTime(task: ISchedule) {
  const startDay = dayjs(task.start as string)
  const endDay = dayjs(task.end as string)
  const isSameDay = startDay.isSame(endDay, 'day')
  if (!isSameDay) return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
  if (task.isAllDay) return ({ start: 'all day', end: 'all day' })
  return ({ start: startDay.format('HH:mm'), end: endDay.format('HH:mm') })
}

const Task: React.FC<{
  task: ISchedule
  showTimeDot?: boolean
  type?: 'overdue' | 'allDay' | 'time'
}> = ({ task, showTimeDot = false, type = 'allDay' }) => {
  const startDay = dayjs(task.start as string)
  const endDay = dayjs(task.end as string)
  const timeFormatter = startDay.isSame(endDay, 'day') ? 'HH:mm' : 'HH:mm (ddd)'
  const isActive = type === 'time' && dayjs().isBetween(startDay, endDay)
  const isDone = task?.raw?.marker === 'DONE'

  const { start, end } = getTime(task)

  const navToBlock = async () => {
    const rawData: any = task.raw
    const { id: pageId, originalName } = rawData?.page || {}
    let pageName = originalName
    if (!pageName) {
      const page = await getPageData({ id: pageId })
      pageName = page?.originalName
    }
    logseq.Editor.scrollToBlockInPage(pageName, task.id!)
  }
  const embedToToday: React.MouseEventHandler = async (e) => {
    console.log('[faiz:] === embedToToday')
    e.stopPropagation()
    const { preferredDateFormat } = await logseq.App.getUserConfigs()
    const todayPage = format(dayjs().valueOf(), preferredDateFormat)
    const newBlock = await logseq.Editor.insertBlock(task.id!, `((${task?.id})) #${task.calendarId}`, { before: false, sibling: true })
    const logKey: ISettingsForm['logKey'] = logseq.settings?.logKey
    if (logKey?.enabled) {
      await moveBlockToSpecificBlock(newBlock?.uuid!, todayPage, `[[${logKey?.id}]]`)
    } else {
      await moveBlockToNewPage(newBlock?.uuid!, todayPage)
    }
  }

  return (
    <div className="agenda-sidebar-task flex cursor-pointer" style={{ margin: '10px 0', opacity: isDone ? 0.8 : 1 }} onClick={navToBlock}>
      <div
        className="flex flex-col justify-between text-right"
        style={{
          color: isActive ? 'var(--ls-link-text-color)' : 'var(--ls-icon-color)', fontSize: '0.8em',
          width: '50px',
        }}
      >
        {
          type === 'overdue'
            ? <div className="w-full">overdue</div>
            : (
              <>
                <div className="w-full">{start}</div>
                { end !== 'all day' && (<div className="w-full">{end}</div>) }
              </>
            )
        }
      </div>
      <div style={{ width: '4px', backgroundColor: task.bgColor, borderRadius: '2px', margin: '0 6px' }}></div>
      <div>
        <div style={{ color: 'var(--ls-icon-color)', fontSize: '0.8em' }}>{task.calendarId}</div>
        <div style={{ marginBottom: '-0.2em' }}>{task.title}</div>
      </div>
      {/* <div className="flex items-center"> */}
        {
          (task.calendarId?.toLocaleLowerCase() !== 'journal' || type === 'overdue') && (
            <div onClick={embedToToday} className="agenda-sidebar-task__add flex items-center">
              <GrAddCircle style={{ marginLeft: '4px', color: 'var(--ls-icon-color)', fontSize: '0.8em', opacity: '0.7' }} />
            </div>
          )
        }
      {/* </div> */}


      {/* <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: task.bgColor, color: task.color }} title={task.calendarId}>{task?.calendarId?.[0]?.toUpperCase()}</div>
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
        if (!pageName) {
          const page = await getPageData({ id: pageId })
          pageName = page?.originalName
        }
        const { uuid: blockUuid } = await logseq.Editor.getBlock(rawData.id) || { uuid: '' }
        logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
        logseq.hideMainUI()
      }}><RiExternalLinkLine /></div> */}
    </div>
  )
}

export default Task
