import classNames from 'classnames'
import React, { useState } from 'react'
import { RiExternalLinkLine } from 'react-icons/ri'
import { GrAddCircle } from 'react-icons/gr'
import type { ISchedule } from 'tui-calendar'
import dayjs from 'dayjs'
import { createBlockToSpecificBlock, getPageData, moveBlockToNewPage, moveBlockToSpecificBlock } from '@/util/logseq'
import { format } from 'date-fns'
import { ISettingsForm } from '@/util/type'

function getTime(task: ISchedule, overdue = false) {
  const startStr = task?.start
  const endStr = task?.end

  const startDay = dayjs(startStr as string)
  const endDay = dayjs(endStr as string)
  const isSameDay = startDay.isSame(endDay, 'day')

  if (overdue) {
    if (task.raw?.rawAllDay) {
      if (isSameDay) return ({ start: startDay.format('MM-DD') })
      return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
    } else {
      if (isSameDay && startDay.isSame(dayjs(), 'day')) return ({ start: startDay.format('HH:mm'), end: endDay.format('HH:mm') })
      if (isSameDay) return ({ start: startDay.format('MM-DD') })
      return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
    }
  }

  if (!isSameDay) return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
  if (task.isAllDay) return ({ start: 'all-day' })
  return ({ start: startDay.format('HH:mm'), end: endDay.format('HH:mm') })
}

const Task: React.FC<{
  task: ISchedule
  showTimeDot?: boolean
  type?: 'overdue' | 'allDay' | 'time'
}> = ({ task, showTimeDot = false, type = 'allDay' }) => {
  const startDay = dayjs(task.start as string)
  const endDay = dayjs(task.end as string)
  const isActive = type === 'time' && dayjs().isBetween(startDay, endDay)
  const isDone = task?.raw?.marker === 'DONE'

  const { start, end } = getTime(task, type === 'overdue')

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
    console.log('[faiz:] === embedToToday', task)
    e.stopPropagation()
    const scheduleId = task.id?.replace('overdue-', '')
    const { preferredDateFormat } = await logseq.App.getUserConfigs()
    const todayPage = format(dayjs().valueOf(), preferredDateFormat)
    const logKey: ISettingsForm['logKey'] = logseq.settings?.logKey
    const newBlock = await logseq.Editor.insertBlock(scheduleId!, `((${scheduleId}))` + (task.calendarId?.toLocaleLowerCase() === 'journal' ? '' : ` #[[${task.calendarId}]]`), { before: false, sibling: true })
    if (logKey?.enabled) {
      await moveBlockToSpecificBlock(newBlock?.uuid!, todayPage, `[[${logKey?.id}]]`)
      // await createBlockToSpecificBlock(todayPage, `[[${logKey?.id}]]`, `((${scheduleId})) #[[${task.calendarId}]]`)
    } else {
      await moveBlockToNewPage(newBlock?.uuid!, todayPage)
      // await logseq.Editor.insertBlock(todayPage, `((${scheduleId})) #[[${task.calendarId}]]`)
    }
    logseq.Editor.scrollToBlockInPage(todayPage, newBlock?.uuid!)
    logseq.UI.showMsg('Embed task to today success', 'success')
  }

  return (
    <div className="agenda-sidebar-task flex cursor-pointer" style={{ margin: '10px 0', opacity: isDone ? 0.4 : 0.9 }} onClick={navToBlock}>
      <div
        className="flex flex-col justify-between text-right"
        style={{
          // color: isActive ? 'var(--ls-link-text-color)' : 'var(--ls-icon-color)', fontSize: '0.8em',
          color: type === 'overdue' ? '#ed4245' : 'var(--ls-icon-color)', fontSize: '0.8em',
          width: '50px',
        }}
      >
        <div className="w-full">{start}</div>
        { end && (<div className="w-full" style={{ opacity: 0.6 }}>{end}</div>) }
      </div>
      <div style={{ width: '4px', backgroundColor: task.bgColor, borderRadius: '2px', margin: '0 6px' }}></div>
      <div style={{ width: 'calc(100% - 90px)', paddingBottom: '24px', position: 'relative' }}>
        <div style={{ color: 'var(--ls-icon-color)', fontSize: '0.8em', opacity: 0.6 }}>{task.calendarId}</div>
        <div className="agenda-sidebar-task__title" style={{ marginBottom: '-0.2em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', position: 'absolute', bottom: 0, width: 'calc(100% - 30px)' }} title={task.title}>{task.title}</div>
        { isActive && <span
          className="ui__button bg-indigo-600"
          style={{ fontSize: '0.5em', position: 'absolute', right: 0, bottom: 0, padding: '0 3px', borderRadius: '3px' }}
          >NOW</span> }
      </div>

      <div onClick={embedToToday} className="agenda-sidebar-task__add flex" style={{ alignItems: 'center', paddingLeft: '8px' }}>
        <GrAddCircle style={{ color: 'var(--ls-icon-color)', fontSize: '0.8em', opacity: '0.7', marginTop: '0.2em' }} />
      </div>

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
