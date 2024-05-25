import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import rrulePlugin from '@fullcalendar/rrule'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Button } from 'antd'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MdSchedule } from 'react-icons/md'

// import useTheme from '@/hooks/useTheme'
import { useTheme } from '@/Agenda3/components/ThemeProvider'
import { genDurationString } from '@/Agenda3/helpers/block'
import { transformAgendaTaskToCalendarEvent } from '@/Agenda3/helpers/fullCalendar'
import { track } from '@/Agenda3/helpers/umami'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import { recentTasksAtom } from '@/Agenda3/models/entities/tasks'
import { settingsAtom } from '@/Agenda3/models/settings'
import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { CalendarEvent } from '@/types/fullcalendar'
import { cn } from '@/util/util'

import TaskModal from '../modals/TaskModal'
import { type CreateTaskForm } from '../modals/TaskModal/useCreate'
import TheCalendarEvent from './TheCalendarEvent'
import s from './timebox.module.less'

type FullCalendarEventInfo = {
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
const FULL_CALENDAR_24HOUR_FORMAT = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
} as const
const TimeBox = ({ onChangeType }: { onChangeType?: () => void }) => {
  const { t } = useTranslation()
  const { currentTheme: theme } = useTheme()
  const settings = useAtomValue(settingsAtom)
  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'
  const calendarRef = useRef<FullCalendar>(null)
  const { updateEntity } = useAgendaEntities()
  const recentTasks = useAtomValue(recentTasksAtom)
  const now = dayjs()
  const calendarEvents = recentTasks
    // TODO: 补充 deadline 任务的处理后移除次过滤器
    .filter((task) => task.start)
    .map((task) =>
      transformAgendaTaskToCalendarEvent(task, {
        showFirstEventInCycleOnly: settings.viewOptions?.showFirstEventInCycleOnly,
        showTimeLog: settings.viewOptions?.showTimeLog,
        groupType,
      }),
    )
    .flat()

  // const [editTaskModal, setEditTaskModal] = useState<{
  //   open: boolean
  //   task?: AgendaTask
  // }>({
  //   open: false,
  // })
  const [createTaskModal, setCreateTaskModal] = useState<
    | { open: false }
    | {
        open: true
        initialData: Partial<CreateTaskForm>
      }
  >({
    open: false,
  })

  // const onEventClick = (info: unknown) => {
  //   const _info = info as FullCalendarEventInfo
  //   setEditTaskModal({
  //     open: true,
  //     task: _info.event.extendedProps,
  //   })
  // }

  const onEventScheduleUpdate = (info: unknown) => {
    const calendarApi = calendarRef.current?.getApi()
    const _info = info as FullCalendarEventInfo
    console.log('[faiz:] === eventResize', _info)
    const { start, end, id: blockUUID, extendedProps: task } = _info.event
    const startDay = dayjs(start)
    const span = dayjs(end).diff(start, 'minute')
    // 原本没有设置 estimatedTime 时，除非新的预估时间不等于默认预估时间，否则仍不修改 estimatedTime
    const estimatedTime = task.estimatedTime || span !== DEFAULT_ESTIMATED_TIME ? span : undefined
    try {
      updateEntity({
        type: 'task-date',
        id: blockUUID,
        data: {
          start: startDay,
          estimatedTime,
          allDay: false,
        },
      })
      const event = calendarApi?.getEventById(blockUUID)
      if (event) {
        event.setProp('extendedProps', {
          ...event.extendedProps,
          start: startDay,
          allDay: false,
          estimatedTime,
        })
      }
    } catch (error) {
      logseq.UI.showMsg('resize failed')
      _info.revert()
      console.error('[Agenda3] timebox resize failed', error)
    }
  }

  const onClickNav = (action: 'prev' | 'next' | 'today') => {
    const calendarApi = calendarRef.current?.getApi()
    if (action === 'today') {
      calendarApi?.today()
    } else if (action === 'prev') {
      calendarApi?.prev()
    } else if (action === 'next') {
      calendarApi?.next()
    }
    track('TimeBox: Click Nav Button', { action })
  }

  return (
    <div
      className={cn(
        'group/root flex h-full w-[290px] flex-col border-l bg-gray-50 pl-2 shadow-md dark:bg-zinc-900',
        s.fullCalendarTimeBox,
      )}
      style={{
        // @ts-expect-error define fullcalendar css variables
        '--fc-border-color': theme === 'dark' ? '#444' : '#ebebeb',
        '--fc-highlight-color': theme === 'dark' ? 'rgba(188,232,241,.1)' : 'rgba(188,232,241,.3)',
        '--fc-page-bg-color': theme === 'dark' ? '#444' : '#fff',
      }}
    >
      <div className="group flex h-[44px] items-center justify-between">
        <div className="flex cursor-default items-center gap-1.5 px-2 py-1">
          <MdSchedule className="text-lg" /> Time Box
        </div>
        <div className="mr-4 flex opacity-0 transition-opacity group-hover/root:opacity-100">
          <Button size="small" type="text" icon={<LeftOutlined />} onClick={() => onClickNav('prev')} />
          <Button size="small" type="text" onClick={() => onClickNav('today')}>
            {t('Today')}
          </Button>
          <Button size="small" type="text" icon={<RightOutlined />} onClick={() => onClickNav('next')} />
        </div>
      </div>
      <FullCalendar
        droppable
        editable
        selectable
        ref={calendarRef}
        events={[
          ...calendarEvents,
          // {
          //   title: 'test background',
          //   start: '2023-09-22T10:30:00+08:00',
          //   end: '2023-09-22T12:00:00+08:00',
          //   display: 'background',
          // },
        ]}
        headerToolbar={false}
        initialView="timeGridOneDay"
        defaultTimedEventDuration="00:30"
        plugins={[timeGridPlugin, interactionPlugin, rrulePlugin]}
        eventTimeFormat={FULL_CALENDAR_24HOUR_FORMAT}
        slotLabelFormat={FULL_CALENDAR_24HOUR_FORMAT}
        // drag external kanban element to calendar
        eventReceive={(info) => {
          onEventScheduleUpdate(info)
          track('Time Box: Receive Event')
        }}
        // resize duration
        eventResize={(info) => {
          onEventScheduleUpdate(info)
          track('Time Box: Resize Event')
        }}
        // drag move
        eventDrop={(info) => {
          onEventScheduleUpdate(info)
          track('Time Box: Move Event')
        }}
        // click
        // eventClick={onEventClick}
        select={(info) => {
          setCreateTaskModal({
            open: true,
            initialData: {
              startDateVal: dayjs(info.start),
              startTime: dayjs(info.start).format('HH:mm'),
              estimatedTime: genDurationString(dayjs(info.end).diff(info.start, 'minute')),
            },
          })
          track('Time Box: Select Event')
        }}
        eventContent={(info) => <TheCalendarEvent info={info} />}
        views={{
          timeGridOneDay: {
            type: 'timeGrid',
            duration: { days: 1 },
            allDaySlot: false,
            nowIndicator: true,
            slotDuration: '00:15:00',
            slotLabelInterval: '01:00',
            scrollTime: now.subtract(1, 'hour').format('HH:mm:ss'),
            dayHeaderContent: (date) => {
              const day = dayjs(date.date)
              const isToday = day.isSame(now, 'day')
              return (
                <div className="flex gap-1 text-gray-500 dark:text-gray-300">
                  {day.format('ddd')}
                  <span
                    className={cn('h-6 w-6 rounded ', {
                      'bg-blue-400 text-white dark:bg-blue-600 dark:text-gray-100': isToday,
                    })}
                  >
                    {day.format('DD')}
                  </span>
                </div>
              )
            },
          },
        }}
      />
      {createTaskModal.open ? (
        <TaskModal
          open={createTaskModal.open}
          onOk={() => {
            setCreateTaskModal({ open: false })
          }}
          onCancel={() => setCreateTaskModal({ open: false })}
          info={{ type: 'create', initialData: createTaskModal.initialData }}
        />
      ) : null}
    </div>
  )
}

export default TimeBox
