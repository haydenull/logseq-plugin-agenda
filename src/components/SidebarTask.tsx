import { format } from 'date-fns'
import dayjs from 'dayjs'
import { GiTomato } from 'react-icons/gi'
import { MdPlaylistAdd } from 'react-icons/md'

import { startPomodoro } from '@/register/pomodoro'
import type { IEvent } from '@/util/events'
import { fixedBlockUUID, navToBlock } from '@/util/logseq'

function getTime(task: IEvent, overdue = false) {
  const startStr = task?.addOns.start
  const endStr = task?.addOns.end

  const startDay = dayjs(startStr)
  const endDay = dayjs(endStr)
  const isSameDay = startDay.isSame(endDay, 'day')

  if (overdue) {
    if (task.addOns.allDay) {
      if (isSameDay) return { start: startDay.format('MM-DD') }
      return { start: startDay.format('MM-DD'), end: endDay.format('MM-DD') }
    } else {
      if (isSameDay && startDay.isSame(dayjs(), 'day'))
        return { start: startDay.format('HH:mm'), end: endDay.format('HH:mm') }
      if (isSameDay) return { start: startDay.format('MM-DD') }
      return { start: startDay.format('MM-DD'), end: endDay.format('MM-DD') }
    }
  }

  if (!isSameDay) return { start: startDay.format('MM-DD'), end: endDay.format('MM-DD') }
  if (task.addOns.allDay) return { start: 'all-day' }
  return { start: startDay.format('HH:mm'), end: endDay.format('HH:mm') }
}

const Task = ({ task, type = 'allDay' }: { task: IEvent; type?: 'overdue' | 'allDay' | 'time' }) => {
  const startDay = dayjs(task.addOns.start)
  const endDay = dayjs(task.addOns.end)
  const isActive = type === 'time' && dayjs().isBetween(startDay, endDay)
  const isDone = task.addOns.status === 'done'
  const calendarConfig = task.addOns.calendarConfig

  const { start, end } = getTime(task, type === 'overdue')
  const embedToToday: React.MouseEventHandler = async (e) => {
    e.stopPropagation()
    const scheduleId = task.uuid
    const { preferredDateFormat } = await logseq.App.getUserConfigs()
    const todayPage = format(dayjs().valueOf(), preferredDateFormat)

    await fixedBlockUUID(task.uuid)
    const newBlock = await logseq.Editor.insertBlock(todayPage, `((${scheduleId}))`)
    if (!newBlock) return logseq.UI.showMsg('Embed task to today failed', 'error')

    logseq.Editor.scrollToBlockInPage(todayPage, newBlock.uuid)
    logseq.UI.showMsg('Embed task to today success', 'success')
  }
  const onClickStartPomodoro: React.MouseEventHandler = (e) => {
    e.stopPropagation()
    startPomodoro(task.uuid)
  }

  return (
    <div
      className="agenda-sidebar-task flex cursor-pointer relative"
      style={{ opacity: isDone ? 0.4 : 0.9 }}
      onClick={() => navToBlock(task)}
    >
      {/* time info */}
      <div
        className="flex flex-col justify-between text-right"
        style={{
          // color: isActive ? 'var(--ls-link-text-color)' : 'var(--ls-icon-color)', fontSize: '0.8em',
          color: type === 'overdue' ? '#ed4245' : 'var(--ls-icon-color)',
          fontSize: '0.8em',
          width: '44px',
        }}
      >
        <div className="w-full">{start}</div>
        {end && (
          <div className="w-full" style={{ opacity: 0.6 }}>
            {end}
          </div>
        )}
      </div>

      {/* divider */}
      <div
        style={{ width: '3px', backgroundColor: calendarConfig?.bgColor, borderRadius: '2px', margin: '0 6px' }}
      ></div>

      {/* task info */}
      <div style={{ width: 'calc(100% - 59px)' }} className="relative">
        {/* project info */}
        <div className="truncate" style={{ color: 'var(--ls-icon-color)', fontSize: '0.8em', opacity: 0.6 }}>
          {calendarConfig?.id}
        </div>
        {/* task title */}
        <div
          className="agenda-sidebar-task__title line-clamp-2"
          style={{ width: 'calc(100% - 30px)' }}
          title={task.addOns.showTitle}
        >
          {task.addOns.showTitle}
        </div>
        {/* NOW Badge */}
        {isActive && (
          <span
            className="ui__button bg-indigo-600 absolute right-0"
            style={{
              fontSize: '0.5em',
              padding: '0 3px',
              borderRadius: '3px',
              top: 'calc(50% - 7px)',
            }}
          >
            NOW
          </span>
        )}
      </div>

      {/* actions */}
      <div className="absolute top-0 h-full agenda-sidebar-task__action flex-row">
        <div onClick={embedToToday} className="flex" style={{ alignItems: 'center', paddingLeft: '8px' }}>
          <MdPlaylistAdd
            style={{ color: 'var(--ls-icon-color)', fontSize: '1.2em', opacity: '0.7', marginTop: '0.2em' }}
          />
        </div>
        <div onClick={onClickStartPomodoro} className="flex" style={{ alignItems: 'center', paddingLeft: '8px' }}>
          <GiTomato style={{ color: 'var(--ls-icon-color)', fontSize: '0.9em', opacity: '0.7', marginTop: '0.2em' }} />
        </div>
      </div>
    </div>
  )
}

export default Task
