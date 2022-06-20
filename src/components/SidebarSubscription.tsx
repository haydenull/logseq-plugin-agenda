import dayjs from 'dayjs'
import { ISchedule } from 'tui-calendar'

function getTime(subscription: ISchedule) {
  const startStr = subscription.start
  const endStr = subscription.end

  const startDay = dayjs(startStr as string)
  const endDay = dayjs(endStr as string)
  const isSameDay = startDay.isSame(endDay, 'day')

  if (!isSameDay) return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
  if (subscription.isAllDay) return ({ start: 'all-day' })
  return ({ start: startDay.format('HH:mm'), end: endDay.format('HH:mm') })
}

const subscription: React.FC<{
  subscription: ISchedule
  type?: 'allDay' | 'time'
}> = ({ subscription, type = 'allDay' }) => {
  const startDay = dayjs(subscription.start as string)
  const endDay = dayjs(subscription.end as string)
  const isActive = type === 'time' && dayjs().isBetween(startDay, endDay)

  const { start, end } = getTime(subscription)

  return (
    <div className="agenda-sidebar-task flex cursor-pointer" style={{ margin: '10px 0', opacity: 0.9 }}>
      <div
        className="flex flex-col justify-between text-right"
        style={{
          color: 'var(--ls-icon-color)',
          fontSize: '0.8em',
          width: '50px',
        }}
      >
        <div className="w-full">{start}</div>
        { end && (<div className="w-full" style={{ opacity: 0.6 }}>{end}</div>) }
      </div>
      <div style={{ width: '4px', backgroundColor: subscription.bgColor, borderRadius: '2px', margin: '0 6px' }}></div>
      <div style={{ width: 'calc(100% - 90px)', paddingBottom: '24px', position: 'relative' }}>
        <div style={{ color: 'var(--ls-icon-color)', fontSize: '0.8em', opacity: 0.6 }}>{subscription?.calendarId}</div>
        <div
          className="agenda-sidebar-task__title"
          style={{ marginBottom: '-0.2em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', position: 'absolute', bottom: 0, width: 'calc(100% - 30px)' }}
          title={subscription.title}
        >
          {subscription.title}
        </div>
        { isActive && <span
          className="ui__button bg-indigo-600"
          style={{ fontSize: '0.5em', position: 'absolute', right: 0, bottom: 0, padding: '0 3px', borderRadius: '3px' }}
          >NOW</span> }
      </div>
    </div>
  )
}

export default subscription
