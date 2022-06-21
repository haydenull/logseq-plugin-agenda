import classNames from 'classnames'
import dayjs from 'dayjs'
import s from '../index.module.less'
import { ISchedule } from 'tui-calendar'

function getTime(subscription: ISchedule) {
  const startStr = subscription?.start as string
  const endStr = subscription?.end as string

  const startDay = dayjs(startStr)
  const endDay = dayjs(endStr)
  const isSameDay = startDay.isSame(endDay, 'day')

  if (!isSameDay) return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
  if (subscription.isAllDay) return ({ start: 'all-day' })
  return ({ start: startDay.format('HH:mm'), end: endDay.format('HH:mm') })
}

const subscription: React.FC<{
  subscription: ISchedule
  showTimeDot?: boolean
  type?: 'overdue' | 'allDay' | 'time'
}> = ({ subscription, showTimeDot = false, type = 'allDay' }) => {
  const startDay = dayjs(subscription.start as string)
  const endDay = dayjs(subscription.end as string)
  const isActive = type !== 'overdue' && dayjs().isBetween(startDay, endDay)

  const { start, end } = getTime(subscription)

  return (
    <div className={classNames(s.task, { [s.taskActive]: isActive }, s?.[type], 'flex pl-5 pr-4 py-2 items-center justify-between')}>
      { showTimeDot && <div className={classNames(s.time)}><span>{startDay?.format('HH:mm')}</span></div> }
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: subscription?.bgColor, color: subscription?.color }} title={subscription.calendarId}>{Array.from(subscription.calendarId!)?.[0]?.toUpperCase()}</div>
      <div className="flex flex-col flex-1 ellipsis mx-4">
        <span className="ellipsis text">{subscription.title}</span>
        <div className={classNames(s.sub, 'text-xs flex justify-between')}>
          <span className="description-text">{end ? `${start} - ${end}` : start}</span>
          <span className="ml-2 ellipsis #6b531a" title={subscription.calendarId}>{subscription.calendarId}</span>
        </div>
      </div>
    </div>
  )
}

export default subscription
