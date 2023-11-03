import { ThirdPartyDraggable } from '@fullcalendar/interaction'
import { Progress, message } from 'antd'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline, IoMdCheckmarkCircleOutline } from 'react-icons/io'
import { IoAddCircleOutline, IoRepeatOutline } from 'react-icons/io5'
import { ReactSortable } from 'react-sortablejs'

import { DEFAULT_ESTIMATED_TIME, recentDaysRange } from '@/constants/agenda'
import useAgendaTasks from '@/hooks/useAgendaTasks'
import { updateDateInfo, updateTaskStatus } from '@/newHelper/block'
import { minutesToHHmm } from '@/newHelper/fullCalendar'
import { DATE_FORMATTER_FOR_KEY, separateTasksInDay, transformTasksToKanbanTasks } from '@/newHelper/task'
import { appAtom } from '@/newModel/app'
import { logseqAtom } from '@/newModel/logseq'
import { settingsAtom } from '@/newModel/settings'
import { recentTasksAtom } from '@/newModel/tasks'
import type { AgendaTaskWithStart, AgendaTask } from '@/types/task'
import { cn, genDays, replaceDateInfo } from '@/util/util'

import TaskModal from './TaskModal'

export type KanBanItem = AgendaTaskWithStart & {
  filtered?: boolean
}

const getRecentDays = () => {
  const [startDay, endDay] = recentDaysRange
  return genDays(startDay, endDay)
}
export type KanBanHandle = {
  scrollToToday: () => void
}
let hadBindDrop = false
const KanBan = (props, ref) => {
  const settings = useAtomValue(settingsAtom)
  const kanBanContainerRef = useRef<HTMLDivElement>(null)
  const { updateTaskData, addNewTask, deleteTask } = useAgendaTasks()
  const recentTasks = useAtomValue(recentTasksAtom)
  const { currentGraph } = useAtomValue(logseqAtom)
  const tasks = transformTasksToKanbanTasks(recentTasks, {
    showFirstEventInCycleOnly: settings.viewOptions?.showFirstEventInCycleOnly,
  })
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
  const navToLogseqBlock = (task: AgendaTaskWithStart) => {
    if (!currentGraph) return
    const uuid = task.recurringPast ? task.id.split('_')[0] : task.id
    // example: logseq://graph/zio?block-id=65385ad5-f4e9-4423-8595-a5e4236cc8ad
    window.open(`logseq://graph/${currentGraph.name}?block-id=${uuid}`, '_blank')
  }

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
              <div
                data-umami-event="KanBan: Add Task Button"
                data-umami-event-today={isToday}
                className={cn(
                  'bg-white rounded-md p-2 my-2 text-gray-400 text-sm flex items-center hover:shadow cursor-pointer group justify-between',
                  {
                    'bg-[#edeef0]': undoneTasks.length === 0,
                  },
                )}
              >
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
                umami.track('KanBan: Drag Task')
              }}
            >
              {_dayTasks.map((task) => {
                const editDisabled = task.rrule || task.recurringPast
                const isMultipleDays = task.allDay && task.end
                const estimatedTime = task.estimatedTime ?? DEFAULT_ESTIMATED_TIME
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'bg-white rounded-md p-2 hover:shadow whitespace-pre-wrap cursor-pointer group/card',
                      {
                        'bg-[#edeef0]': task.status === 'done',
                        'cursor-not-allowed': editDisabled,
                        // 循环任务及多天任务不能拖拽
                        'droppable-task-element': !editDisabled && !isMultipleDays,
                      },
                    )}
                    data-event={JSON.stringify({
                      id: task.id,
                      title: task.title,
                      duration: minutesToHHmm(estimatedTime),
                      color: task.project.bgColor,
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
                        {task.rrule || task.recurringPast ? <IoRepeatOutline className="text-gray-400" /> : null}
                        <div
                          className="text-gray-300 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            navToLogseqBlock(task)
                          }}
                        >
                          {/* logseq logo */}
                          <svg width="1em" height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fill="currentColor"
                              stroke="currentColor"
                              d="M19.3 9.838c-2.677-1.366-5.467-1.56-8.316-.607c-1.738.58-3.197 1.58-4.267 3.088c-1.031 1.452-1.45 3.071-1.184 4.837c.268 1.781 1.164 3.228 2.505 4.4C9.96 23.231 12.24 23.942 15.092 24c.41-.053 1.157-.103 1.883-.255c2.004-.418 3.754-1.325 5.08-2.915c1.621-1.942 2.108-4.148 1.272-6.562c-.704-2.034-2.138-3.467-4.027-4.43ZM7.515 6.295c.507-2.162-.88-4.664-2.988-5.37c-1.106-.37-2.156-.267-3.075.492C.61 2.114.294 3.064.271 4.146c.009.135.016.285.029.435c.01.102.021.205.042.305c.351 1.703 1.262 2.98 2.9 3.636c1.912.766 3.808-.244 4.273-2.227Zm4.064-1.146c1.075.377 2.152.31 3.22-.033c.94-.3 1.755-.793 2.341-1.609c.803-1.117.5-2.387-.717-3.027c-.6-.317-1.246-.438-1.927-.48c-.47.076-.95.117-1.41.234c-1.068.27-2.002.781-2.653 1.7c-.495.697-.64 1.45-.174 2.227c.303.504.779.799 1.32.988Z"
                            ></path>
                          </svg>
                        </div>
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
