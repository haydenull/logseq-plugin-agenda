import { ThirdPartyDraggable } from '@fullcalendar/interaction'
import { Button, Progress, message } from 'antd'
import clsx from 'clsx'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtom, useAtomValue } from 'jotai'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { BsPatchCheck, BsPatchCheckFill } from 'react-icons/bs'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline, IoMdCheckmarkCircleOutline } from 'react-icons/io'
import { IoAddCircleOutline, IoCheckbox, IoCheckboxOutline } from 'react-icons/io5'
import { ReactSortable } from 'react-sortablejs'

import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import useAgendaTasks from '@/hooks/useAgendaTasks'
import { genDurationString, parseDurationString, updateDateInfo, updateTask, updateTaskStatus } from '@/newHelper/block'
import { minutesToHHmm } from '@/newHelper/fullCalendar'
import { DATE_FORMATTER_FOR_KEY, separateTasksInDay, transformTasksToKanbanTasks } from '@/newHelper/task'
import { appAtom } from '@/newModel/app'
import { recentTasksAtom } from '@/newModel/tasks'
import type { AgendaTaskWithStart, AgendaTask } from '@/types/task'
import { cn, genDays, replaceDateInfo } from '@/util/util'

import TaskModal from './TaskModal'

export type KanBanItem = AgendaTaskWithStart & {
  filtered?: boolean
}

const getRecentDays = () => {
  const startDay = dayjs().subtract(7, 'day')
  const endDay = dayjs().add(14, 'day')
  return genDays(startDay, endDay)
}
export type KanBanHandle = {
  scrollToToday: () => void
}
let hadBindDrop = false
const KanBan = (props, ref) => {
  const kanBanContainerRef = useRef<HTMLDivElement>(null)
  const { updateTaskData, addNewTask, deleteTask } = useAgendaTasks()
  const [recentTasks] = useAtom(recentTasksAtom)
  const tasks = transformTasksToKanbanTasks(recentTasks)
  const tasksInDay = separateTasksInDay(tasks)
  const days = getRecentDays()
  const today = dayjs()

  const app = useAtomValue(appAtom)

  const [editTaskModal, setEditTaskModal] = useState<{
    open: boolean
    task?: AgendaTask
  }>({
    open: false,
  })

  const onClickTaskMark = (event: React.MouseEvent, task: AgendaTask, status: AgendaTask['status']) => {
    if (task.rrule) return message.error('Please modify the status of the recurring task in logseq.')
    updateTaskData(task.id, {
      ...task,
      status,
    })
    updateTaskStatus(task, status)
    event.stopPropagation()
  }
  const scrollToToday = useCallback(() => {
    const todayDateStr = today.format('MM-DD ddd')
    document.getElementById(`${todayDateStr}`)?.scrollIntoView({ block: 'nearest', inline: 'start' })
    kanBanContainerRef.current?.scrollBy({ left: -30, behavior: 'smooth' })
  }, [])
  // scroll to today
  useEffect(() => {
    scrollToToday()
  }, [scrollToToday])

  // bind draggable
  useEffect(() => {
    console.log('[faiz:] === bind draggable', app.view)
    if (app.view === 'tasks' && !hadBindDrop && kanBanContainerRef.current) {
      // console.log('bind drop', document.getElementsByClassName('droppable-task-element'))
      new ThirdPartyDraggable(kanBanContainerRef.current, {
        itemSelector: '.droppable-task-element',
        mirrorSelector: '.dragged-mirror-element',
      })
      hadBindDrop = true
    }
    return () => {
      hadBindDrop = false
    }
  }, [app.view])

  useImperativeHandle(ref, () => ({
    scrollToToday,
  }))

  return (
    <div className="flex gap-8 overflow-auto flex-1 h-full" ref={kanBanContainerRef}>
      {/* ========= Single Day List ========= */}
      {days.map((day) => {
        const dateStr = day.format('MM-DD ddd')
        const columnTasks = tasksInDay.get(day.format(DATE_FORMATTER_FOR_KEY)) || []
        const isToday = day.isSame(today, 'day')
        const isFuture = day.isAfter(today, 'day')
        const doneTasks = columnTasks.filter((task) => task.status === 'done')
        const undoneTasks = columnTasks.filter((task) => task.status !== 'done')
        const _dayTasks = undoneTasks.concat(doneTasks)
        const estimatedTime = _dayTasks.reduce((acc, task) => {
          return acc + (task.estimatedTime ?? DEFAULT_ESTIMATED_TIME)
        }, 0)
        const actualTime = _dayTasks.reduce((acc, task) => {
          return acc + (task.actualTime ?? task.estimatedTime ?? DEFAULT_ESTIMATED_TIME)
        }, 0)
        return (
          <div key={dateStr} className="w-[265px] shrink-0 mt-2 flex flex-col" id={dateStr}>
            <div className="flex items-center justify-between">
              <div className="text-2xl flex gap-2 items-center">
                <span>{day.format('ddd')}</span>
                <span className="text-gray-400">{day.format('MMM DD')}</span>
                {/* {isToday ? <span className="px-1 py-0.5 text-xs bg-blue-400 rounded text-white">Today</span> : null} */}
              </div>
              <div>
                {isFuture ? null : (
                  <span
                    className="text-[10px] text-gray-400 hover:text-gray-700 cursor-pointer"
                    onClick={() => message.info('Coming soon.')}
                  >
                    Review
                  </span>
                )}
              </div>
            </div>
            {isToday ? (
              <Progress
                size="small"
                status="success"
                className="!m-0"
                showInfo={false}
                percent={(doneTasks.length / _dayTasks.length) * 100}
              />
            ) : (
              <div className="h-[24px]"></div>
            )}
            <TaskModal onOk={addNewTask} info={{ type: 'create', initialData: { startDateVal: day } }}>
              <div className="bg-white rounded-md p-2 my-2 text-gray-400 text-sm flex items-center hover:shadow cursor-default group justify-between">
                <div className="flex items-center gap-1">
                  <IoAddCircleOutline />
                  <span className={cn('group-hover:opacity-100 transition-opacity', { 'opacity-0': !isToday })}>
                    Add a task
                  </span>
                </div>
                <div className="bg-gray-200 rounded text-xs px-1 py-0.5 text-[10px]">
                  {minutesToHHmm(actualTime)} / {minutesToHHmm(estimatedTime)}
                </div>
              </div>
            </TaskModal>
            {/* ========= Tasks List ========= */}
            <ReactSortable
              forceFallback // 该属性如果不加就无法与 fullcalendar 交互
              className={cn('flex flex-col gap-2 flex-1 overflow-y-auto', { 'pb-28': _dayTasks.length === 0 })}
              group="shared"
              dragClass="dragged-mirror-element"
              draggable=".droppable-task-element"
              list={_dayTasks}
              // onMove={(event, originalEvent) => {
              //   console.log('[faiz:] === xxx onMove', event)
              //   console.log('[faiz:] === xxx originalEvent', originalEvent)
              //   return true
              // }}
              setList={(list) => {
                // console.log(`[faiz:] === setList ${day.format('MM-DD ddd')}`, list)
              }}
              onAdd={async (sortableEvent) => {
                const id = sortableEvent?.item?.dataset?.id
                const task = tasks.find((task) => task.id === id)
                if (!task || !id) return logseq.UI.showMsg('task id not found', 'error')
                let startDay = day
                // remain time info
                if (task.allDay === false) {
                  startDay = replaceDateInfo(task.start, day)
                }
                updateTaskData(id, { start: startDay })
                updateDateInfo({
                  uuid: id,
                  start: startDay,
                  allDay: task.allDay,
                })
              }}
            >
              {_dayTasks.map((task) => {
                const editDisabled = task.rrule || task.recurringPast
                const estimatedTime = task.estimatedTime ?? DEFAULT_ESTIMATED_TIME
                return (
                  <div
                    key={task.id}
                    className={cn('bg-white rounded-md p-2 hover:shadow whitespace-pre-wrap cursor-default', {
                      'opacity-60': task.status === 'done',
                      'cursor-not-allowed': editDisabled,
                      'droppable-task-element': !(editDisabled || task.end) || !task.allDay,
                    })}
                    data-event={JSON.stringify({
                      id: task.id,
                      title: task.title,
                      duration: minutesToHHmm(estimatedTime),
                    })}
                    onClick={() => !editDisabled && setEditTaskModal({ open: true, task })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 items-center">
                        {task.status === 'done' ? (
                          <IoIosCheckmarkCircle
                            className="text-xl cursor-pointer text-gray-300"
                            onClick={(e) => onClickTaskMark(e, task, 'todo')}
                          />
                        ) : (
                          <IoIosCheckmarkCircleOutline
                            className="text-gray-300 text-xl cursor-pointer"
                            onClick={(e) => onClickTaskMark(e, task, 'done')}
                          />
                        )}
                        {task.allDay ? null : (
                          <span
                            className="text-[10px] rounded px-1 py-0.5 text-white opacity-70"
                            style={{
                              backgroundColor: task.project.bgColor,
                            }}
                          >
                            {task.start.format('HH:mm')}
                          </span>
                        )}
                      </div>
                      <div className="bg-gray-100 rounded px-1 py-0.5 text-gray-400 text-[10px]">
                        {task.status === 'done' ? (
                          <span>{minutesToHHmm(task.actualTime ?? estimatedTime)} / </span>
                        ) : null}
                        {minutesToHHmm(estimatedTime)}
                      </div>
                    </div>
                    <div className={cn('text-gray-600 my-0.5', { 'line-through': task.status === 'done' })}>
                      {task.title}
                    </div>
                    {task.project.isJournal ? null : (
                      <div className="text-gray-400 text-xs flex gap-1 items-center">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.bgColor }} />
                        <span>{task.project?.originalName}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </ReactSortable>
          </div>
        )
      })}
      {/* ========== Edit Task Modal ========== */}
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
      {/* Daily Review Modal */}
    </div>
  )
}

export default forwardRef<KanBanHandle>(KanBan)
