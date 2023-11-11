import { Dropdown, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtomValue } from 'jotai'
import React, { useState } from 'react'
import { BsArchive } from 'react-icons/bs'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { IoAddCircleOutline, IoRepeatOutline } from 'react-icons/io5'
import { RiDeleteBin4Line, RiInboxUnarchiveLine } from 'react-icons/ri'
import { ReactSortable } from 'react-sortablejs'

import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import useAgendaTasks from '@/hooks/useAgendaTasks'
import { deleteDateInfo, updateDateInfo, updateTaskStatus } from '@/newHelper/block'
import { minutesToHHmm } from '@/newHelper/fullCalendar'
import { navToLogseqBlock } from '@/newHelper/logseq'
import { formatTaskTitle } from '@/newHelper/task'
import { track } from '@/newHelper/umami'
import { logseqAtom } from '@/newModel/logseq'
import { backlogTasksAtom, thisMonthTasksAtom, thisWeekTasksAtom, todayTasksAtom } from '@/newModel/tasks'
import type { AgendaTask, AgendaTaskWithStart } from '@/types/task'
import { cn, replaceDateInfo } from '@/util/util'

import Backlog from './Backlog'
import FullScreenModal from './FullScreenModal'
import LogseqLogo from './LogseqLogo'
import TaskModal from './TaskModal'

const PlannerModal = ({ children, triggerClassName }: { children: React.ReactNode; triggerClassName?: string }) => {
  const today = dayjs()
  const [open, setOpen] = useState(false)
  const [editTaskModal, setEditTaskModal] = useState<{
    open: boolean
    task?: AgendaTask
  }>({
    open: false,
  })

  const backlogTasks = useAtomValue(backlogTasksAtom)
  const { currentGraph } = useAtomValue(logseqAtom)
  const todayTasks = useAtomValue(todayTasksAtom)
  const thisWeekTasks = useAtomValue(thisWeekTasksAtom)
  const thisMonthTasks = useAtomValue(thisMonthTasksAtom)
  const tasks = [...todayTasks, ...thisWeekTasks, ...thisMonthTasks]

  const dayMap = {
    today,
    week: today.endOf('week'),
    month: today.endOf('month'),
  }
  const tasksInCycle = {
    today: todayTasks,
    week: thisWeekTasks,
    month: thisMonthTasks,
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
    deleteTask(taskId)
  }
  const onRemoveDate = async (taskId: string) => {
    updateTaskData(taskId, {
      allDay: true,
      start: undefined,
    })
    deleteDateInfo(taskId)
  }

  return (
    <>
      <span className={triggerClassName} onClick={() => setOpen(true)}>
        {children}
      </span>
      <FullScreenModal open={open} onClose={() => setOpen(false)}>
        <div className="w-screen h-screen p-8 flex gap-8 overflow-auto bg-gray-50">
          {['today', 'week', 'month'].map((cycle) => {
            const cycleTasks: AgendaTaskWithStart[] = tasksInCycle[cycle]
            const day = dayMap[cycle]
            const estimatedTime = cycleTasks.reduce((acc, task) => {
              return acc + (task.estimatedTime ?? DEFAULT_ESTIMATED_TIME)
            }, 0)
            return (
              <div key={cycle} className="w-[265px] shrink-0 mt-2 flex flex-col">
                <div className="flex items-center justify-center">
                  <div className="text-2xl relative">
                    <span className="uppercase">{cycle}</span>
                    {/* <span className="text-gray-400 text-xs absolute w-[100px] -right-[104px] bottom-1">
                      {day.format('MMM DD ddd')}
                    </span> */}
                    {/* <span className="px-1 py-0.5 text-xs bg-blue-400 rounded text-white uppercase">{cycle}</span> */}
                  </div>
                </div>
                {(cycle === 'week' && isTodayLastDayOfWeek) || (cycle === 'month' && isTodayLastDayOfMonth) ? (
                  <div className="text-center text-gray-400 mt-1">
                    Today is the last day of {cycle}, do not forget to review your tasks.
                  </div>
                ) : (
                  <>
                    <TaskModal onOk={addNewTask} info={{ type: 'create', initialData: { startDateVal: today } }}>
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
                        {cycle === 'today' ? (
                          <div className="bg-gray-200 rounded text-xs px-1 py-0.5 text-[10px]">
                            {minutesToHHmm(estimatedTime)}
                          </div>
                        ) : null}
                      </div>
                    </TaskModal>
                    <ReactSortable
                      forceFallback // 该属性如果不加就无法与 fullcalendar 交互
                      className={cn('flex flex-col gap-2 flex-1 overflow-y-auto', { 'pb-28': todayTasks.length === 0 })}
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
                        const task = backlogTasks.concat(tasks).find((task) => task.id === id)
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
                                  editDisabled
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

          <div className="absolute top-0 right-0 h-screen pt-12">
            <Backlog bindCalendar={false} />
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

export default PlannerModal
