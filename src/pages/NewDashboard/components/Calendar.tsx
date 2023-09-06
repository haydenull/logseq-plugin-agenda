import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import rrulePlugin from '@fullcalendar/rrule'
import timeGridPlugin from '@fullcalendar/timegrid'
import { message } from 'antd'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useAtom } from 'jotai'
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { IoIosCheckmarkCircle } from 'react-icons/io'

import useAgendaTasks from '@/hooks/useAgendaTasks'
import { deleteTask as deleteTaskBlock, genDurationString, updateDateInfo } from '@/newHelper/block'
import { transformAgendaTaskToCalendarEvent } from '@/newHelper/fullCalendar'
import { tasksWithStartAtom } from '@/newModel/tasks'
import type { CalendarEvent } from '@/types/fullcalendar'
import type { AgendaTask, AgendaTaskWithStart } from '@/types/task'
import { cn } from '@/util/util'

import TaskModal from './TaskModal'
import { type CreateTaskForm } from './TaskModal/useCreate'
import s from './calendar.module.less'

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
export type CalendarView = 'dayGridMonth' | 'dayGridWeek' | 'timeGridWeek'
const FULL_CALENDAR_24HOUR_FORMAT = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
} as const
type CalendarProps = { onCalendarTitleChange: (title: string) => void }
const Calendar = ({ onCalendarTitleChange }: CalendarProps, ref) => {
  // const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth')
  const calendarRef = useRef<FullCalendar>(null)
  const { updateTaskData, deleteTask, addNewTask } = useAgendaTasks()
  const [tasksWithStart] = useAtom(tasksWithStartAtom)
  // const now = dayjs()
  const calendarEvents = tasksWithStart?.map(transformAgendaTaskToCalendarEvent)

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

  const onEventClick = (info: unknown) => {
    const _info = info as FullCalendarEventInfo
    const editDisabled = _info.event.extendedProps?.rrule || _info.event.extendedProps?.recurringPast
    if (editDisabled) return message.error('Please modify the recurring task in the logseq.')
    setEditTaskModal({
      open: true,
      task: _info.event.extendedProps,
    })
  }
  const onEventScheduleUpdate = (info: unknown) => {
    const calendarApi = calendarRef.current?.getApi()
    const _info = info as FullCalendarEventInfo
    console.log('[faiz:] === eventResize', _info)
    const { start, end, id: blockUUID, allDay, extendedProps } = _info.event
    const startDay = dayjs(start)
    const estimatedTime = dayjs(end).diff(start, 'minute')
    console.log('[faiz:] === estimatedTime', estimatedTime)
    const endDay = dayjs(end).subtract(1, 'day')
    const isMultipleDay = end ? !dayjs(end).isSame(endDay, 'day') : false
    const dateInfo = {
      start: startDay,
      estimatedTime: allDay ? extendedProps.estimatedTime : dayjs(end).diff(start, 'minute'),
      end: isMultipleDay ? endDay : undefined,
      allDay,
    }
    console.log('[faiz:] === dateInfo', dateInfo)
    try {
      updateTaskData(blockUUID, dateInfo)
      updateDateInfo({
        ...dateInfo,
        uuid: blockUUID,
      })
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
      _info.revert()
      console.error('[Agenda3] timebox resize failed', error)
    }
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
      navToday: () => {
        calendarApi?.today()
      },
    }
  })

  return (
    <div
      className={cn('h-full flex flex-col', s.fullCalendar)}
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
        weekNumberClassNames="text-xs"
        fixedWeekCount={false}
        ref={calendarRef}
        height="100%"
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
        initialView="dayGridMonth"
        dayHeaderClassNames="!border-x-0"
        plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin, rrulePlugin]}
        eventTimeFormat={FULL_CALENDAR_24HOUR_FORMAT}
        slotLabelFormat={FULL_CALENDAR_24HOUR_FORMAT}
        datesSet={(info) => {
          onCalendarTitleChange(info.view.title)
        }}
        // drag external kanban element to calendar
        eventReceive={onEventScheduleUpdate}
        // resize duration
        eventResize={onEventScheduleUpdate}
        // drag move
        eventDrop={onEventScheduleUpdate}
        // click event
        eventClick={onEventClick}
        select={(info) => {
          console.log('[faiz:] === select', info)
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
        }}
        eventContent={(info) => {
          const editDisabled = info.event.extendedProps?.rrule || info.event.extendedProps?.recurringPast
          const isShowTimeText =
            info.event.allDay === false && dayjs(info.event.end).diff(info.event.start, 'minute') > 50
          const isDone = info.event.extendedProps?.status === 'done'
          let element: React.ReactNode | null = null
          switch (info.view.type) {
            case 'dayGridMonth':
            case 'dayGridWeek':
              element = (
                <div
                  className={clsx('flex items-center gap-1 w-full px-0.5 relative', {
                    'opacity-60 line-through': isDone,
                    'font-semibold': !isDone,
                    'cursor-not-allowed': editDisabled,
                  })}
                  title={info.event.title}
                >
                  {info.event.allDay ? null : <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  <span className="truncate flex-1">{info.event.title}</span>
                  {isDone ? <IoIosCheckmarkCircle className="text-green-500 absolute right-0" /> : null}
                </div>
              )
              break
            case 'timeGridWeek':
              element = (
                <div className={clsx('h-full relative', { 'opacity-70': isDone, 'cursor-not-allowed': editDisabled })}>
                  <div className={clsx('truncate', { 'line-through': isDone, 'font-semibold': !isDone })}>
                    {info.event.title}
                  </div>
                  {isShowTimeText ? <div className="text-xs text-gray-200">{info.timeText}</div> : null}
                  {isDone ? <IoIosCheckmarkCircle className="text-green-500 absolute right-0 top-0.5" /> : null}
                </div>
              )
              break
            default:
              element = null
          }
          return element
        }}
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
                  className={clsx('flex gap-1 h-[34px] items-center', isWeekend ? 'text-gray-400' : 'text-gray-700')}
                >
                  {day.format('ddd')}
                  <span
                    className={cn(
                      'w-6 h-6 items-center flex justify-center',
                      date.isToday ? 'bg-blue-400 rounded text-white' : '',
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
          onOk={(taskInfo) => {
            updateTaskData(taskInfo.id, taskInfo)
            setEditTaskModal({ open: false })
          }}
          onDelete={(taskId) => {
            deleteTask(taskId)
            setEditTaskModal({ open: false })
          }}
        />
      ) : null}
      {createTaskModal.open ? (
        <TaskModal
          open={createTaskModal.open}
          onOk={(task) => {
            addNewTask(task)
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
  changeView: (view: CalendarView) => void
  navToday: () => void
}
export default forwardRef<CalendarHandle, CalendarProps>(Calendar)
