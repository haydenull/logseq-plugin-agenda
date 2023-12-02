import { ThirdPartyDraggable } from '@fullcalendar/interaction'
import { Dropdown, Progress, message } from 'antd'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { BsArchive } from 'react-icons/bs'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { IoAddCircleOutline, IoRepeatOutline } from 'react-icons/io5'
import { RiDeleteBin4Line } from 'react-icons/ri'
import { ReactSortable } from 'react-sortablejs'

import {
  deleteDateInfo,
  updateDateInfo,
  updateTaskStatus,
  deleteTask as deleteTaskBlock,
} from '@/Agenda3/helpers/block'
import { minutesToHHmm } from '@/Agenda3/helpers/fullCalendar'
import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import {
  DATE_FORMATTER_FOR_KEY,
  formatTaskTitle,
  separateTasksInDay,
  transformTasksToKanbanTasks,
} from '@/Agenda3/helpers/task'
import { track } from '@/Agenda3/helpers/umami'
import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import { appAtom } from '@/Agenda3/models/app'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { settingsAtom } from '@/Agenda3/models/settings'
import { recentTasksAtom } from '@/Agenda3/models/tasks'
import { DEFAULT_ESTIMATED_TIME, recentDaysRange } from '@/constants/agenda'
import type { AgendaTaskWithStart, AgendaTask } from '@/types/task'
import { cn, genDays, replaceDateInfo } from '@/util/util'

import Group from './Group'
import LogseqLogo from './icons/LogseqLogo'
import PlannerModal from './modals/PlannerModal'
import TaskModal from './modals/TaskModal'

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

  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'

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
      rawBlock: {
        ...task.rawBlock,
        marker: status === 'todo' ? 'TODO' : 'DONE',
      },
    })
    updateTaskStatus(task, status)
    event.stopPropagation()
  }
  const onDeleteTask = async (taskId: string) => {
    deleteTask(taskId)
    deleteTaskBlock(taskId)
  }
  const onRemoveDate = async (taskId: string) => {
    updateTaskData(taskId, {
      allDay: true,
      start: undefined,
    })
    deleteDateInfo(taskId)
  }
  const scrollToToday = useCallback(() => {
    const todayDateStr = dayjs().format('MM-DD ddd')
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
        const isTomorrow = day.isSame(today.add(1, 'day'), 'day')
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
              <div className="flex gap-2 items-center">
                {isToday ? (
                  <PlannerModal
                    type="today"
                    triggerClassName="text-[10px] text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    Plan
                  </PlannerModal>
                ) : null}
                {isTomorrow ? (
                  <PlannerModal
                    type="tomorrow"
                    triggerClassName="text-[10px] text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    Plan
                  </PlannerModal>
                ) : null}
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
                onClick={() => track('KanBan: Add Task Button', { today: String(isToday) })}
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
                console.log('[faiz:] === kanban onAdd', sortableEvent)
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
                track('KanBan: Drag Task')
              }}
            >
              {_dayTasks.map((task) => {
                const editDisabled = task.rrule || task.recurringPast
                const isMultipleDays = task.allDay && task.end
                const estimatedTime = task.estimatedTime ?? DEFAULT_ESTIMATED_TIME
                const showTitle = formatTaskTitle(task)
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'bg-white rounded-md p-2 hover:shadow whitespace-pre-wrap cursor-pointer group/card',
                      {
                        'bg-[#edeef0] opacity-80': task.status === 'done',
                        // 循环任务及多天任务不能拖拽
                        'droppable-task-element': !editDisabled && !isMultipleDays,
                      },
                    )}
                    data-event={JSON.stringify({
                      id: task.id,
                      title: showTitle,
                      duration: minutesToHHmm(estimatedTime),
                      color: groupType === 'page' ? task.project.bgColor : task?.filters?.[0]?.color,
                    })}
                  >
                    <Dropdown
                      trigger={['contextMenu']}
                      menu={{
                        items: [
                          editDisabled || task.project.isJournal
                            ? null
                            : {
                                key: 'backlog',
                                label: 'Move to backlog',
                                icon: <BsArchive className="!text-sm" />,
                              },
                          {
                            key: 'delete',
                            label: 'Delete task',
                            danger: true,
                            icon: <RiDeleteBin4Line className="!text-base" />,
                          },
                        ],
                        onClick: ({ key }) => {
                          if (key === 'delete') onDeleteTask(task.id)
                          if (key === 'backlog') onRemoveDate(task.id)
                        },
                      }}
                    >
                      <div onClick={() => setEditTaskModal({ open: true, task })}>
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
                                  backgroundColor:
                                    groupType === 'page' ? task.project.bgColor : task?.filters?.[0]?.color,
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
                                navToLogseqBlock(task, currentGraph)
                              }}
                            >
                              <LogseqLogo />
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
                          {showTitle}
                        </div>
                        <Group task={task} type={groupType} />
                      </div>
                    </Dropdown>
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
