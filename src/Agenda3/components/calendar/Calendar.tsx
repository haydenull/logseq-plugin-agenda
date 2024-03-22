import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import enLocale from '@fullcalendar/core/locales/en-gb'
import esLocale from '@fullcalendar/core/locales/es'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type EventReceiveArg, type EventResizeDoneArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import rrulePlugin from '@fullcalendar/rrule'
import timeGridPlugin from '@fullcalendar/timegrid'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { genDurationString, updateBlockDateInfo } from '@/Agenda3/helpers/block'
import { transformAgendaTaskToCalendarEvent } from '@/Agenda3/helpers/fullCalendar'
import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import { track } from '@/Agenda3/helpers/umami'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import { appAtom } from '@/Agenda3/models/app'
import { tasksWithStartAtom } from '@/Agenda3/models/entities/tasks'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { settingsAtom } from '@/Agenda3/models/settings'
import type { AgendaTaskWithStart } from '@/types/task'
import { cn } from '@/util/util'

import TaskModal from '../modals/TaskModal'
import { type CreateTaskForm } from '../modals/TaskModal/useCreate'
import { type CalendarView } from './CalendarAdvancedOperation'
import TheCalendarEvent from './TheCalendarEvent'
import WeekNumber from './WeekNumber'
import s from './calendar.module.less'

const FULL_CALENDAR_24HOUR_FORMAT = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
} as const
type CalendarProps = { onCalendarTitleChange: (title: string) => void }
const Calendar = ({ onCalendarTitleChange }: CalendarProps, ref) => {
  // const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth')
  const calendarRef = useRef<FullCalendar>(null)
  const app = useAtomValue(appAtom)
  const { updateEntity } = useAgendaEntities()
  const tasksWithStart = useAtomValue(tasksWithStartAtom)
  const settings = useAtomValue(settingsAtom)
  const { currentGraph } = useAtomValue(logseqAtom)
  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'
  const showTasks = tasksWithStart?.filter((task) =>
    settings.viewOptions?.hideCompleted ? task.status === 'todo' : true,
  )
  // const now = dayjs()
  const calendarEvents = showTasks
    ?.map((task) =>
      transformAgendaTaskToCalendarEvent(task, {
        showFirstEventInCycleOnly: settings.viewOptions?.showFirstEventInCycleOnly,
        showTimeLog: settings.viewOptions?.showTimeLog,
        groupType,
      }),
    )
    .flat()

  const [editTaskModal, setEditTaskModal] = useState<{
    open: boolean
    task?: AgendaTaskWithStart
  }>({
    open: false,
  })
  const [createTaskModal, setCreateTaskModal] = useState<
    | { open: false }
    | {
        open: true
        initialData: Partial<CreateTaskForm>
      }
  >({
    open: false,
  })

  const onEventClick = (info: EventClickArg) => {
    setEditTaskModal({
      open: true,
      task: info.event.extendedProps as AgendaTaskWithStart,
    })
  }
  const onEventCtrlClick = (info: EventClickArg) => {
    navToLogseqBlock(info.event.extendedProps as AgendaTaskWithStart, currentGraph)
  }
  const onEventScheduleUpdate = (info: EventResizeDoneArg | EventReceiveArg | EventDropArg) => {
    // const calendarApi = calendarRef.current?.getApi()
    const { start, end, id: blockUUID, allDay, extendedProps } = info.event
    const startDay = dayjs(start)
    // const estimatedTime = dayjs(end).diff(start, 'minute')
    const endDay = dayjs(end).subtract(1, 'day')
    const isMultipleDay = end && allDay ? !dayjs(end).isSame(endDay, 'day') : false
    const dateInfo = {
      start: startDay,
      estimatedTime: allDay ? extendedProps.estimatedTime : dayjs(end).diff(start, 'minute'),
      end: isMultipleDay ? endDay : undefined,
      allDay,
    }
    try {
      updateEntity({ type: 'task-date', id: blockUUID, data: dateInfo })
      // const event = calendarApi?.getEventById(blockUUID)
      // if (event) {
      //   event.setProp('extendedProps', {
      //     ...event.extendedProps,
      //     ...dateInfo,
      //   })
      // }

      // refreshAllTasks()
      // 其他天移动到今天的 timebox，需要对应移动 kanban
    } catch (error) {
      logseq.UI.showMsg('resize failed')
      info.revert()
      console.error('[Agenda3] calendar resize failed', error)
    }
  }
  const onSelect = (info: DateSelectArg) => {
    if (info.allDay) {
      const endDay = dayjs(info.end).subtract(1, 'day')
      const startDay = dayjs(info.start)
      const isMultipleDay = info.end ? !endDay.isSame(startDay, 'day') : false
      return setCreateTaskModal({
        open: true,
        initialData: {
          startDateVal: startDay,
          endDateVal: isMultipleDay ? endDay : undefined,
        },
      })
    }
    setCreateTaskModal({
      open: true,
      initialData: {
        startDateVal: dayjs(info.start),
        startTime: dayjs(info.start).format('HH:mm'),
        estimatedTime: genDurationString(dayjs(info.end).diff(info.start, 'minute')),
      },
    })
  }

  useImperativeHandle(ref, () => {
    const calendarApi = calendarRef.current?.getApi()
    return {
      next: () => {
        calendarApi?.next()
      },
      prev: () => {
        calendarApi?.prev()
      },
      changeView: (view: CalendarView) => {
        calendarApi?.changeView(view)
      },
      getView: () => {
        return calendarApi?.view.type
      },
      getDate: () => {
        return calendarApi?.getDate()
      },
      navToday: () => {
        calendarApi?.today()
      },
    }
  })

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current?.getApi()
      setTimeout(() => {
        calendarApi.updateSize()
      }, 300) // The duration here needs to be longer than the sidebar animation duration.
    }
  }, [app.rightSidebarFolded])

  return (
    <div
      className={cn('flex h-full flex-col', s.fullCalendar)}
      style={{
        // @ts-expect-error define fullcalendar css variables
        '--fc-border-color': '#e5e5e5',
        '--fc-today-bg-color': 'transparent',
      }}
    >
      <FullCalendar
        droppable
        editable
        selectable
        dayMaxEventRows // allow "more" link when too many events
        weekNumbers
        weekNumberContent={({ num, date }) => <WeekNumber weekNumber={num} date={date} />}
        defaultTimedEventDuration="00:30"
        firstDay={1}
        fixedWeekCount={false}
        ref={calendarRef}
        height="100%"
        // locales={[esLocale]}
        // locale={enLocale}
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
        // headerToolbar={{
        //   left: 'prev,next',
        //   center: 'title',
        //   right: 'dayGridMonth,timeGridWeek',
        // }}
        initialView={app.calendarView}
        dayHeaderClassNames="!border-x-0"
        plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin, rrulePlugin]}
        eventTimeFormat={FULL_CALENDAR_24HOUR_FORMAT}
        slotLabelFormat={FULL_CALENDAR_24HOUR_FORMAT}
        datesSet={(info) => {
          onCalendarTitleChange(info.view.title)
        }}
        // drag external kanban element to calendar
        eventReceive={(info) => {
          onEventScheduleUpdate(info)
          track('Calendar: Receive Event', { calendarView: info.view.type })
        }}
        // resize duration
        eventResize={(info) => {
          onEventScheduleUpdate(info)
          track('Calendar: Resize Event', { calendarView: info.view.type })
        }}
        // drag move
        eventDrop={(info) => {
          onEventScheduleUpdate(info)
          track('Calendar: Move Event', { calendarView: info.view.type })
        }}
        // click event
        eventClick={(info) => {
          if (info.jsEvent?.ctrlKey) {
            onEventCtrlClick(info)
          } else {
            onEventClick(info)
          }
          track('Calendar: Click Event', { calendarView: info.view.type })
        }}
        select={(info) => {
          // prevent click week number to create task
          // @ts-expect-error type correctly
          if (info.jsEvent?.target?.className?.includes('faiz-week-number')) return
          track('Calendar: Select Event', { calendarView: info.view.type })
          onSelect(info)
        }}
        eventContent={(info) => <TheCalendarEvent info={info} />}
        views={{
          timeGridWeek: {
            // dayMaxEvents: true,
            nowIndicator: true,
            scrollTime: dayjs().subtract(1, 'hour').format('HH:mm:ss'),
            dayHeaderContent: (date) => {
              const day = dayjs(date.date)
              const isWeekend = day.day() === 6 || day.day() === 0
              return (
                <div
                  className={clsx('flex h-[34px] items-center gap-1', isWeekend ? 'text-gray-400' : 'text-gray-700')}
                >
                  {day.format('ddd')}
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center',
                      date.isToday ? 'rounded bg-blue-400 text-white' : '',
                    )}
                  >
                    {day.format('DD')}
                  </span>
                </div>
              )
            },
          },
        }}
      />
      {editTaskModal.task ? (
        <TaskModal
          key={editTaskModal.task.id}
          open={editTaskModal.open}
          onCancel={() => setEditTaskModal({ open: false })}
          info={{
            type: 'edit',
            initialTaskData: editTaskModal.task,
          }}
          onOk={() => {
            setEditTaskModal({ open: false })
          }}
          onDelete={() => {
            setEditTaskModal({ open: false })
          }}
        />
      ) : null}
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

export type CalendarHandle = {
  prev: () => void
  next: () => void
  getView: () => CalendarView
  getDate: () => Date
  changeView: (view: CalendarView) => void
  navToday: () => void
}
export default forwardRef<CalendarHandle, CalendarProps>(Calendar)
