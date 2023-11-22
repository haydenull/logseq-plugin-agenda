import { Dropdown, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtomValue } from 'jotai'
import React, { useState } from 'react'
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'
import { BsArchive } from 'react-icons/bs'
import { GoGoal } from 'react-icons/go'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { IoAddCircleOutline, IoRepeatOutline } from 'react-icons/io5'
import { RiDeleteBin4Line } from 'react-icons/ri'
import { ReactSortable } from 'react-sortablejs'

import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import useAgendaTasks from '@/hooks/useAgendaTasks'
import { deleteDateInfo, updateDateInfo, updateTaskStatus, deleteTask as deleteTaskBlock } from '@/newHelper/block'
import { minutesToHHmm } from '@/newHelper/fullCalendar'
import { navToLogseqBlock } from '@/newHelper/logseq'
import { formatTaskTitle } from '@/newHelper/task'
import { track } from '@/newHelper/umami'
import { logseqAtom } from '@/newModel/logseq'
import {
  backlogTasksAtom,
  overdueTasksAtom,
  thisMonthExcludeTomorrowTasksAtom,
  thisMonthObjectivesAtom,
  thisMonthTasksAtom,
  thisWeekExcludeTomorrowTasksAtom,
  thisWeekObjectivesAtom,
  thisWeekTasksAtom,
  todayTasksAtom,
  tomorrowTasksAtom,
} from '@/newModel/tasks'
import type { AgendaObjective, AgendaTask, AgendaTaskWithStart } from '@/types/task'
import { cn, replaceDateInfo } from '@/util/util'

import Backlog from './Backlog'
import FullScreenModal from './FullScreenModal'
import LogseqLogo from './LogseqLogo'
import TaskModal from './TaskModal'

const PlannerModal = ({
  children,
  triggerClassName,
  type,
}: {
  children: React.ReactNode
  triggerClassName?: string
  type: 'today' | 'tomorrow'
}) => {
  const today = dayjs()
  const [open, setOpen] = useState(false)
  const [backlogFolded, setBacklogFolded] = useState(false)
  const [editTaskModal, setEditTaskModal] = useState<{
    open: boolean
    task?: AgendaTask
  }>({
    open: false,
  })

  const backlogTasks = useAtomValue(backlogTasksAtom)
  const { currentGraph } = useAtomValue(logseqAtom)
  const todayTasks = useAtomValue(todayTasksAtom)
  const tomorrowTasks = useAtomValue(tomorrowTasksAtom)
  const thisWeekTasks = useAtomValue(thisWeekTasksAtom)
  const thisMonthTasks = useAtomValue(thisMonthTasksAtom)
  const thisWeekExcludeTomorrowTasks = useAtomValue(thisWeekExcludeTomorrowTasksAtom)
  const thisMonthExcludeTomorrowTasks = useAtomValue(thisMonthExcludeTomorrowTasksAtom)
  const overdueTasks = useAtomValue(overdueTasksAtom)
  const tasks =
    type === 'today'
      ? [...todayTasks, ...thisWeekTasks, ...thisMonthTasks]
      : [...todayTasks, ...tomorrowTasks, ...thisWeekExcludeTomorrowTasks, ...thisMonthExcludeTomorrowTasks]

  const thisWeekObjectives = useAtomValue(thisWeekObjectivesAtom)
  const thisMonthObjectives = useAtomValue(thisMonthObjectivesAtom)

  const cycles =
    type === 'today' ? (['today', 'week', 'month'] as const) : (['today', 'tomorrow', 'week', 'month'] as const)
  const dayMap = {
    today,
    tomorrow: today.add(1, 'day'),
    week: today.endOf('week'),
    month: today.endOf('month'),
  }
  const tasksInCycle = {
    today: todayTasks,
    tomorrow: tomorrowTasks,
    week: type === 'today' ? thisWeekTasks : thisWeekExcludeTomorrowTasks,
    month: type === 'today' ? thisMonthTasks : thisMonthExcludeTomorrowTasks,
  }
  const objectivesInCycle = {
    week: thisWeekObjectives,
    month: thisMonthObjectives,
  }
  const isTodayLastDayOfWeek = today.isSame(dayMap.week, 'day')
  const isTodayLastDayOfMonth = today.isSame(dayMap.month, 'day')

  const { updateTaskData, addNewTask, deleteTask } = useAgendaTasks()

  const onClickTaskMark = (event: React.MouseEvent, task: AgendaTask, status: AgendaTask['status']) => {
    if (task.rrule) return message.error('Please modify the status of the recurring task in logseq.')
    updateTaskData(task.id, {
      ...task,
      status,
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
  const onClickClose = () => {
    setOpen(false)
    setBacklogFolded(false)
  }

  return (
    <>
      <span className={triggerClassName} onClick={() => setOpen(true)}>
        {children}
      </span>
      <FullScreenModal open={open} onClose={onClickClose}>
        <div
          className={cn(
            'w-screen h-full px-3 pt-8 pb-1 flex gap-3 overflow-auto bg-gray-50',
            backlogFolded ? 'pr-3' : 'pr-[300px]',
          )}
        >
          {/* Overdue */}
          <div className="w-[281px] shrink-0 mt-2 flex flex-col bg-gray-300 px-2 py-2 rounded-md">
            <div className="flex items-center justify-center mb-2">
              <div className="text-2xl relative">
                <span className="uppercase">Overdue</span>
              </div>
            </div>
            <ReactSortable
              forceFallback // 该属性如果不加就无法与 fullcalendar 交互
              className={cn('flex flex-col gap-2 flex-1 overflow-y-auto hide-scroll-bar', {
                'pb-28': todayTasks.length === 0,
              })}
              group="planner"
              dragClass="dragged-mirror-element"
              draggable=".droppable-task-element"
              list={overdueTasks}
              setList={(list) => {}}
            >
              {overdueTasks.map((task) => {
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
                        // 循环任务及多天任务不能拖拽
                        'droppable-task-element': !editDisabled && !isMultipleDays,
                      },
                    )}
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
                            <IoIosCheckmarkCircleOutline
                              className="text-gray-300 text-xl cursor-pointer"
                              onClick={(e) => onClickTaskMark(e, task, 'done')}
                            />
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
                        {task.project.isJournal ? null : (
                          <div className="text-gray-400 text-xs flex gap-1 items-center">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.bgColor }} />
                            <span>{task.project?.originalName}</span>
                          </div>
                        )}
                      </div>
                    </Dropdown>
                  </div>
                )
              })}
            </ReactSortable>
          </div>
          {/* Cycle */}
          {cycles.map((cycle) => {
            const cycleTasks: AgendaTaskWithStart[] = tasksInCycle[cycle]
            const cycleObjectives: AgendaObjective[] = objectivesInCycle[cycle] ?? []
            const day = dayMap[cycle]
            const estimatedTime = cycleTasks.reduce((acc, task) => {
              return acc + (task.estimatedTime ?? DEFAULT_ESTIMATED_TIME)
            }, 0)
            return (
              <div key={cycle} className="w-[281px] shrink-0 mt-2 flex flex-col bg-gray-300 px-2 py-2 rounded-md">
                <div className="flex justify-center">
                  <div className="text-2xl relative">
                    <span className="uppercase">{cycle}</span>
                    <span className="text-gray-500 text-[10px] absolute w-[100px] -right-[104px] top-1">
                      {getCycleText(day, cycle)}
                    </span>
                  </div>
                </div>

                {(cycle === 'week' && isTodayLastDayOfWeek) || (cycle === 'month' && isTodayLastDayOfMonth) ? (
                  <div className="text-center text-gray-500 mt-1">
                    Today is the last day of {cycle}, do not forget to review your tasks.
                  </div>
                ) : (
                  <>
                    <TaskModal onOk={addNewTask} info={{ type: 'create', initialData: { startDateVal: day } }}>
                      <div
                        onClick={() => track('Planner: Add Task Button', { position: 'Today' })}
                        className={cn(
                          'bg-white rounded-md p-2 my-2 text-gray-400 text-sm flex items-center hover:shadow cursor-pointer group justify-between',
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <IoAddCircleOutline />
                          <span className="group-hover:opacity-100 transition-opacity">Add a task</span>
                        </div>
                        <div className="bg-gray-200 rounded text-xs px-1 py-0.5 text-[10px]">
                          {minutesToHHmm(estimatedTime)}
                        </div>
                      </div>
                    </TaskModal>
                    <ReactSortable
                      forceFallback // 该属性如果不加就无法与 fullcalendar 交互
                      className={cn('flex flex-col gap-2 flex-1 overflow-y-auto hide-scroll-bar', {
                        'pb-28': todayTasks.length === 0,
                      })}
                      group="planner"
                      dragClass="dragged-mirror-element"
                      draggable=".droppable-task-element"
                      list={cycleTasks}
                      // onMove={(event, originalEvent) => {
                      //   console.log('[faiz:] === xxx onMove', event)
                      //   console.log('[faiz:] === xxx originalEvent', originalEvent)
                      //   return true
                      // }}
                      setList={(list) => {
                        // console.log(`[faiz:] === setList ${day.format('MM-DD ddd')}`, list)
                      }}
                      onAdd={async (sortableEvent) => {
                        console.log(`[faiz:] === planner onAdd`, sortableEvent)
                        const id = sortableEvent?.item?.dataset?.id
                        const task = backlogTasks.concat(tasks, overdueTasks).find((task) => task.id === id)
                        if (!task || !id) return logseq.UI.showMsg('task id not found', 'error')
                        let startDay = day
                        // remain time info
                        if (task.allDay === false && task.start) {
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
                      {cycleObjectives.map((objective) => {
                        const showTitle = formatTaskTitle(objective)
                        return (
                          <div
                            key={objective.id}
                            className={cn(
                              'bg-white rounded-md p-2 hover:shadow whitespace-pre-wrap cursor-pointer group/card relative overflow-hidden shrink-0',
                              {
                                'bg-[#edeef0] opacity-80': objective.status === 'done',
                              },
                            )}
                          >
                            <GoGoal
                              className={cn('absolute text-8xl -right-3 top-1 text-gray-100', {
                                'text-[#e2e3e6]': objective.status === 'done',
                              })}
                            />
                            <div className="relative">
                              <div className="flex items-center justify-between">
                                <div className="flex gap-1 items-center">
                                  {objective.status === 'done' ? (
                                    <IoIosCheckmarkCircle
                                      className="text-xl cursor-pointer text-gray-300"
                                      // onClick={(e) => onClickTaskMark(e, task, 'todo')}
                                    />
                                  ) : (
                                    <IoIosCheckmarkCircleOutline
                                      className="text-gray-300 text-xl cursor-pointer"
                                      // onClick={(e) => onClickTaskMark(e, task, 'done')}
                                    />
                                  )}

                                  <div
                                    className="text-gray-300 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navToLogseqBlock(objective, currentGraph)
                                    }}
                                  >
                                    <LogseqLogo />
                                  </div>
                                </div>
                              </div>
                              <div
                                className={cn('text-gray-600 my-0.5', {
                                  'line-through': objective.status === 'done',
                                })}
                              >
                                {showTitle}
                              </div>
                              {objective.project.isJournal ? null : (
                                <div className="text-gray-400 text-xs flex gap-1 items-center">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: objective.project.bgColor }}
                                  />
                                  <span>{objective.project?.originalName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {cycleTasks.map((task) => {
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
                              color: task.project.bgColor,
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
                                          backgroundColor: task.project.bgColor,
                                        }}
                                      >
                                        {task.start.format('HH:mm')}
                                      </span>
                                    )}
                                    {task.rrule || task.recurringPast ? (
                                      <IoRepeatOutline className="text-gray-400" />
                                    ) : null}
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
                                {task.project.isJournal ? null : (
                                  <div className="text-gray-400 text-xs flex gap-1 items-center">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: task.project.bgColor }}
                                    />
                                    <span>{task.project?.originalName}</span>
                                  </div>
                                )}
                              </div>
                            </Dropdown>
                          </div>
                        )
                      })}
                    </ReactSortable>
                  </>
                )}
              </div>
            )
          })}

          <div
            className={cn(
              'absolute top-0 right-0 h-screen pt-8 transition-all group/backlog',
              backlogFolded ? 'w-0' : 'w-[290px]',
            )}
          >
            <Backlog bindCalendar={false} />
            <div
              className={cn(
                'w-[16px] h-full absolute -left-[16px] top-0 flex items-center z-10 opacity-0 group-hover/backlog:opacity-100 transition-all',
              )}
            >
              <div
                className="bg-[#f0f0f0] h-[50px] w-full rounded-tl rounded-bl flex items-center text-gray-400 hover:bg-gray-200 cursor-pointer border-l border-t border-b"
                onClick={() => setBacklogFolded((folded) => !folded)}
              >
                {backlogFolded ? <AiOutlineLeft /> : <AiOutlineRight />}
              </div>
            </div>
          </div>
        </div>
      </FullScreenModal>
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
    </>
  )
}

function getCycleText(day: Dayjs, cycle: 'today' | 'tomorrow' | 'week' | 'month') {
  if (cycle === 'today' || cycle === 'tomorrow') return day.format('MMM DD, ddd')
  if (cycle === 'week') return 'W' + day.isoWeek()
  if (cycle === 'month') return day.format('MMMM')
  return ''
}

export default PlannerModal
