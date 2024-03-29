import { DeleteOutlined } from '@ant-design/icons'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Dropdown, Tooltip } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { TbArrowsExchange2 } from 'react-icons/tb'

import {
  transformAgendaTaskToCalendarEvent,
  transformAgendaTimeLogsToCalendarEvents,
} from '@/Agenda3/helpers/fullCalendar'
import { tasksWithStartAtom } from '@/Agenda3/models/entities/tasks'
import { cn } from '@/util/util'

import s from './timeboxActual.module.less'

const FULL_CALENDAR_24HOUR_FORMAT = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
} as const
const TimeBoxActual = ({ date }: { date: Dayjs }) => {
  const calendarRef = useRef<FullCalendar>(null)
  // const { refreshTasks: refreshAllTasks } = useAgendaTasks()
  const [tasksWithStart] = useAtom(tasksWithStartAtom)
  const todayTasks = tasksWithStart.filter((task) => dayjs(task.start).isSame(date, 'day'))
  const estimatedTasks = todayTasks.map((task) => transformAgendaTaskToCalendarEvent(task)).flat()
  const actualTasks = todayTasks.map(transformAgendaTimeLogsToCalendarEvents).flat()
  const calendarEvents = [...estimatedTasks, ...actualTasks]

  useEffect(() => {
    calendarRef.current?.getApi()?.gotoDate(date.subtract(1, 'day').toDate())
  }, [date])

  return (
    <div
      className={cn('flex h-full w-[500px] flex-col border-l bg-gray-50 pl-2 shadow-md', s.fullCalendarTimeBox)}
      style={{
        // @ts-expect-error define fullcalendar css variables
        '--fc-border-color': '#ebebeb',
      }}
    >
      <div className="flex h-[44px] items-center">
        <Tooltip title="Click to change to Time Box">
          <div
            className="flex cursor-default items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-100"
            // onClick={onChangeType}
          >
            <TbArrowsExchange2 /> Time Tracking
          </div>
        </Tooltip>
      </div>
      <FullCalendar
        ref={calendarRef}
        events={calendarEvents}
        headerToolbar={false}
        initialView="timeGridOneDay"
        plugins={[timeGridPlugin, interactionPlugin]}
        eventTimeFormat={FULL_CALENDAR_24HOUR_FORMAT}
        slotLabelFormat={FULL_CALENDAR_24HOUR_FORMAT}
        eventContent={(info) => {
          console.log('[faiz:] === eventContent', info)
          return (
            <div className="h-full">
              <div>{info.event.title}</div>
              <div className="text-xs text-gray-200">{info.timeText}</div>
            </div>
          )
        }}
        views={{
          timeGridOneDay: {
            type: 'timeGrid',
            duration: { days: 2 },
            allDaySlot: true,
            // nowIndicator: true,
            // slotDuration: '00:15:00',
            slotLabelInterval: '01:00',
            scrollTime: date.subtract(1, 'hour').format('HH:mm:ss'),
            dayHeaderContent: ({ date: columnDate }) => {
              return (
                <div className="flex gap-1 text-gray-500">
                  {date.format('ddd')}
                  <span className="h-6 w-6 rounded bg-blue-400 text-white">{date.format('DD')}</span>
                  {dayjs(columnDate).isSame(date, 'day') ? 'Actual' : 'Estimated'}
                </div>
              )
            },
          },
        }}
      />
    </div>
  )
}

export default TimeBoxActual
