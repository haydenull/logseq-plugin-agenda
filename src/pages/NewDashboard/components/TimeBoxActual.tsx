import { DeleteOutlined } from '@ant-design/icons'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Dropdown, Tooltip } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtom } from 'jotai'
import { useRef } from 'react'
import { TbArrowsExchange2 } from 'react-icons/tb'

import { addTimeLog, deleteTimeLog, updateTimeLog } from '@/newHelper/block'
import { transformAgendaTimeLogsToCalendarEvents } from '@/newHelper/fullCalendar'
import { type BlockFromQuery, transformBlockToAgendaTask } from '@/newHelper/task'
import { tasksWithStartAtom } from '@/newModel/tasks'
import type { CalendarEvent } from '@/types/fullcalendar'
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
  const now = dayjs()
  const todayTasks = tasksWithStart.filter((task) => dayjs(task.start).isSame(now, 'day'))
  const calendarEvents = todayTasks.map(transformAgendaTimeLogsToCalendarEvents).flat()

  const onEventTimeLogUpdate = (info: unknown) => {
    const _info = info as {
      event: CalendarEvent
      oldEvent: CalendarEvent
      relatedEvents: unknown[]
      revert: () => void
      newResource: unknown
      oldResource: unknown
      delta: unknown
      view: unknown
      el: HTMLElement
      jsEvent: MouseEvent
    }
    const { start, end, id: blockUUIDAndIndex } = _info.event
    const [blockUUID, index] = blockUUIDAndIndex.split('_')
    if (typeof index !== 'string') return _info.revert()
    try {
      updateTimeLog(blockUUID, {
        start: dayjs(start),
        end: dayjs(end),
        index: Number(index),
      })
    } catch (error) {
      logseq.UI.showMsg('resize failed')
      _info.revert()
      console.error('[Agenda3] timebox actual resize failed', error)
    }
  }
  const onEventTimeLogAdd = async (info: unknown) => {
    const calendarApi = calendarRef.current?.getApi()
    const _info = info as {
      event: CalendarEvent
      oldEvent: CalendarEvent
      relatedEvents: unknown[]
      revert: () => void
      newResource: unknown
      oldResource: unknown
      delta: unknown
      view: unknown
      el: HTMLElement
      jsEvent: MouseEvent
    }
    const { start, end, id: blockUUID } = _info.event
    const event = calendarApi?.getEventById(blockUUID)
    const block = await logseq.Editor.getBlock(blockUUID)
    if (!event || !block) return _info.revert()
    const favoritePages = (await logseq.App.getCurrentGraphFavorites()) || []
    const agendaTask = await transformBlockToAgendaTask(block as BlockFromQuery, favoritePages)
    // 将 log index 补充到 id 上，防止 resize 时 index 丢失
    event.setProp('id', `${blockUUID}_${agendaTask.timeLogs.length}`)
    event.setProp('extendedProps', agendaTask)
    try {
      addTimeLog(blockUUID, {
        start: dayjs(start),
        end: dayjs(end),
      })
    } catch (error) {
      logseq.UI.showMsg('Add time log failed')
      _info.revert()
      console.error('[Agenda3] Add time log failed', error)
    }
  }
  const onEventTimeLogDelete = async (info: unknown) => {
    const _info = info as {
      event: CalendarEvent
      oldEvent: CalendarEvent
      relatedEvents: unknown[]
      revert: () => void
      newResource: unknown
      oldResource: unknown
      delta: unknown
      view: unknown
      el: HTMLElement
      jsEvent: MouseEvent
    }
    const calendarApi = calendarRef.current?.getApi()
    const { id: blockUUIDAndIndex } = _info.event
    const [blockUUID, index] = blockUUIDAndIndex.split('_')
    if (typeof index !== 'string' || !calendarApi) return _info.revert()
    try {
      await deleteTimeLog(blockUUID, Number(index))
      const event = calendarApi.getEventById(blockUUIDAndIndex)
      event?.remove()
    } catch (error) {
      logseq.UI.showMsg('Delete time log failed')
      _info.revert()
      console.error('[Agenda3] Delete time log failed', error)
    }
  }

  return (
    <div
      className={cn('w-[290px] h-full border-l pl-2 flex flex-col bg-gray-50 shadow-md', s.fullCalendarTimeBox)}
      style={{
        // @ts-expect-error define fullcalendar css variables
        '--fc-border-color': '#ebebeb',
      }}
    >
      <div className="h-[44px] flex items-center">
        <Tooltip title="Click to change to Time Box">
          <div
            className="flex gap-1.5 hover:bg-gray-100 items-center px-2 py-1 rounded cursor-default"
            // onClick={onChangeType}
          >
            <TbArrowsExchange2 /> Time Tracking
          </div>
        </Tooltip>
      </div>
      <FullCalendar
        droppable
        editable
        ref={calendarRef}
        events={calendarEvents}
        headerToolbar={false}
        initialView="timeGridOneDay"
        plugins={[timeGridPlugin, interactionPlugin]}
        eventTimeFormat={FULL_CALENDAR_24HOUR_FORMAT}
        slotLabelFormat={FULL_CALENDAR_24HOUR_FORMAT}
        // drag external kanban element to calendar
        eventReceive={onEventTimeLogAdd}
        // resize duration
        eventResize={onEventTimeLogUpdate}
        // drag move
        eventDrop={onEventTimeLogUpdate}
        eventContent={(info) => {
          console.log('[faiz:] === eventContent', info)
          return (
            <Dropdown
              trigger={['contextMenu']}
              menu={{
                items: [
                  {
                    key: 'delete',
                    label: 'Delete time log',
                    danger: true,
                    icon: <DeleteOutlined className="!text-base" />,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === 'delete') onEventTimeLogDelete(info)
                },
              }}
            >
              <div className="h-full">
                <div>{info.event.title}</div>
                <div className="text-xs text-gray-200">{info.timeText}</div>
              </div>
            </Dropdown>
          )
        }}
        views={{
          timeGridOneDay: {
            type: 'timeGrid',
            duration: { days: 1 },
            allDaySlot: false,
            nowIndicator: true,
            slotDuration: '00:15:00',
            slotLabelInterval: '01:00',
            scrollTime: now.subtract(1, 'hour').format('HH:mm:ss'),
            dayHeaderContent: (
              <div className="flex gap-1 text-gray-500">
                {now.format('ddd')}
                <span className="w-6 h-6 bg-blue-400 rounded text-white">{now.format('DD')}</span>
              </div>
            ),
          },
        }}
      />
    </div>
  )
}

export default TimeBoxActual
