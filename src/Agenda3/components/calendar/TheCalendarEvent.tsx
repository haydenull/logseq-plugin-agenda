import type { EventContentArg } from '@fullcalendar/core'
import dayjs from 'dayjs'
import { CgSandClock } from 'react-icons/cg'
import { IoIosCheckmarkCircle } from 'react-icons/io'

import { getDaysBetween } from '@/Agenda3/helpers/util'
import { cn } from '@/util/util'

const TheCalendarEvent = ({ info }: { info: EventContentArg }) => {
  const taskData = info.event.extendedProps
  const showTitle = taskData?.id ? taskData.showTitle : info.event.title
  const isShowTimeText = info.event.allDay === false && dayjs(info.event.end).diff(info.event.start, 'minute') > 50
  const isSmallHeight = info.event.allDay === false && dayjs(info.event.end).diff(info.event.start, 'minute') <= 20
  const isDone = taskData?.status === 'done'
  // 是否有截止时间
  const isHasDeadline = taskData?.deadline
  // 距离截止时间还剩多少天, 正数正常显示，负数显示为0
  const daysToDeadline = getDaysBetween(dayjs(), dayjs(taskData?.deadline?.value))
  let element: React.ReactNode | null = null
  switch (info.view.type) {
    case 'dayGridMonth':
    case 'dayGridWeek':
      element = (
        <div
          className={cn('relative flex w-full cursor-pointer items-center gap-1 px-0.5', {
            'line-through opacity-60': isDone,
            'font-semibold': !isDone,
          })}
          title={showTitle}
        >
          {info.event.allDay ? null : (
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.event.backgroundColor }} />
          )}
          <span className="flex-1 truncate">{showTitle}</span>
          {isDone ? (
            <IoIosCheckmarkCircle
              className={cn('absolute right-0', info.event.allDay ? 'text-white' : 'text-green-500')}
            />
          ) : null}
          {isHasDeadline && !isDone ? (
            <div className="flex items-center rounded bg-white/30 px-0.5 text-xs font-normal">
              <CgSandClock className="text-xs" />
              <span className="italic">{daysToDeadline}</span>
            </div>
          ) : null}
        </div>
      )
      break
    case 'timeGridWeek':
      element = (
        <div className={cn('relative h-full cursor-pointer', { 'opacity-70': isDone })}>
          <div
            className={cn('truncate', {
              'line-through': isDone,
              'font-semibold': !isDone,
              'text-[10px]': isSmallHeight,
            })}
          >
            {showTitle}
          </div>
          {isShowTimeText ? <div className="text-xs text-gray-200">{info.timeText}</div> : null}
          {isDone ? <IoIosCheckmarkCircle className="absolute right-0 top-0.5" /> : null}
        </div>
      )
      break
    default:
      element = null
  }
  return element
}

export default TheCalendarEvent
