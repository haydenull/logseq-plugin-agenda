import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Dropdown, Tooltip } from 'antd'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useAtom } from 'jotai'
import { useRef, useState } from 'react'
import { IoIosCheckmarkCircle } from 'react-icons/io'
import { RiDeleteBin4Line, RiInboxUnarchiveLine } from 'react-icons/ri'
import { TbArrowsExchange2 } from 'react-icons/tb'

import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import useAgendaTasks from '@/hooks/useAgendaTasks'
import { deleteTask as deleteTaskBlock, genDurationString, updateDateInfo } from '@/newHelper/block'
import { transformAgendaTaskToCalendarEvent } from '@/newHelper/fullCalendar'
import { tasksWithStartAtom } from '@/newModel/tasks'
import type { CalendarEvent } from '@/types/fullcalendar'
import type { AgendaTask, AgendaTaskWithStart } from '@/types/task'
import { cn } from '@/util/util'

import TaskModal from './TaskModal'
import { type CreateTaskForm } from './TaskModal/useCreate'
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
const TimeBox = ({ onChangeType }: { onChangeType: () => void }) => {
  const calendarRef = useRef<FullCalendar>(null)
  const { updateTaskData, deleteTask, addNewTask } = useAgendaTasks()
  const [tasksWithStart] = useAtom(tasksWithStartAtom)
  const now = dayjs()
  const todayTasks = tasksWithStart.filter((task) => dayjs(task.start).isSame(now, 'day'))
  const calendarEvents = todayTasks?.filter(({ allDay }) => allDay === false).map(transformAgendaTaskToCalendarEvent)
  const calendarApi = calendarRef.current?.getApi()

  const [editTaskModal, setEditTaskModal] = useState<{
    open: boolean
    task?: AgendaTask
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
    setEditTaskModal({
      open: true,
      task: _info.event.extendedProps,
    })
  }
  const onDeleteTask = async (taskId: string) => {
    deleteTask(taskId)
    deleteTaskBlock(taskId)
  }
  const onRemoveTime = async (info: unknown) => {
    const _info = info as FullCalendarEventInfo
    updateTaskData(_info.event.id, {
      allDay: true,
    })
    updateDateInfo({
      uuid: _info.event.id,
      allDay: true,
      start: _info.event.extendedProps.start,
      estimatedTime: _info.event.extendedProps.estimatedTime,
    })
  }
  const onEventScheduleUpdate = (info: unknown) => {
    const _info = info as FullCalendarEventInfo
    console.log('[faiz:] === eventResize', _info)
    const { start, end, id: blockUUID, extendedProps: task } = _info.event
    const startDay = dayjs(start)
    const span = dayjs(end).diff(start, 'minute')
    // 原本没有设置 estimatedTime 时，除非新的预估时间不等于默认预估时间，否则仍不修改 estimatedTime
    const estimatedTime = task.estimatedTime || span !== DEFAULT_ESTIMATED_TIME ? span : undefined
    try {
      updateTaskData(blockUUID, {
        start: startDay,
        allDay: false,
        estimatedTime,
      })
      updateDateInfo({
        uuid: blockUUID,
        start: startDay,
        estimatedTime,
        allDay: false,
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

      // refreshAllTasks()
      // 其他天移动到今天的 timebox，需要对应移动 kanban
    } catch (error) {
      logseq.UI.showMsg('resize failed')
      _info.revert()
      console.error('[Agenda3] timebox resize failed', error)
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
        <div className="flex gap-1.5  items-center px-2 py-1 cursor-default">
          <TbArrowsExchange2 /> Time Box
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
        plugins={[timeGridPlugin, interactionPlugin]}
        eventTimeFormat={FULL_CALENDAR_24HOUR_FORMAT}
        slotLabelFormat={FULL_CALENDAR_24HOUR_FORMAT}
        // drag external kanban element to calendar
        eventReceive={onEventScheduleUpdate}
        // resize duration
        eventResize={onEventScheduleUpdate}
        // drag move
        eventDrop={onEventScheduleUpdate}
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
        }}
        eventContent={(info) => {
          const isShowTimeText =
            info.event.allDay === false && dayjs(info.event.end).diff(info.event.start, 'minute') > 20
          const isDone = info.event.extendedProps?.status === 'done'
          return (
            <TaskModal
              info={{
                type: 'edit',
                initialTaskData: info.event.extendedProps as AgendaTaskWithStart,
              }}
            >
              <Dropdown
                trigger={['contextMenu']}
                menu={{
                  items: [
                    {
                      key: 'remove',
                      label: 'Remove from timebox',
                      icon: <RiInboxUnarchiveLine className="!text-base" />,
                    },
                    {
                      key: 'delete',
                      label: 'Delete task',
                      danger: true,
                      icon: <RiDeleteBin4Line className="!text-base" />,
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'delete') onDeleteTask(info.event.id)
                    if (key === 'remove') onRemoveTime(info)
                  },
                }}
              >
                <div className={clsx('h-full', { 'opacity-70': isDone })}>
                  <div
                    className={clsx('truncate font-semibold flex items-center relative', {
                      'line-through': isDone,
                    })}
                  >
                    {info.event.title}
                    {isDone ? <IoIosCheckmarkCircle className="text-green-500 absolute right-0" /> : null}
                  </div>
                  {isShowTimeText ? <div className="text-xs text-gray-200">{info.timeText}</div> : null}
                </div>
              </Dropdown>
            </TaskModal>
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
      {editTaskModal.task ? (
        <TaskModal
          key={editTaskModal.task.id}
          open={editTaskModal.open}
          info={{ type: 'edit', initialTaskData: editTaskModal.task }}
          onOk={(taskInfo) => {
            updateTaskData(editTaskModal.task!.id, taskInfo)
            setEditTaskModal({ open: false })
          }}
          onCancel={() => setEditTaskModal({ open: false })}
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

export default TimeBox
