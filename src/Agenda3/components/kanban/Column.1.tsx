import { ThirdPartyDraggable } from '@fullcalendar/interaction'
import { Dropdown, Progress, message } from 'antd'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import React from 'react'
import { BsArchive } from 'react-icons/bs'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { IoAddCircleOutline, IoRepeatOutline } from 'react-icons/io5'
import { RiDeleteBin4Line } from 'react-icons/ri'
import { ReactSortable } from 'react-sortablejs'

import {
  deleteBlockDateInfo,
  updateBlockDateInfo,
  updateBlockTaskStatus,
  deleteTaskBlock,
} from '@/Agenda3/helpers/block'
import { minutesToHHmm } from '@/Agenda3/helpers/fullCalendar'
import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import { formatTaskTitle } from '@/Agenda3/helpers/task'
import { track } from '@/Agenda3/helpers/umami'
import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import { appAtom } from '@/Agenda3/models/app'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { settingsAtom } from '@/Agenda3/models/settings'
import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { AgendaTask } from '@/types/task'
import { cn, replaceDateInfo } from '@/util/util'

import Group from '../Group'
import LogseqLogo from '../icons/LogseqLogo'
import TaskModal from '../modals/TaskModal'
import type { ColumnProps } from './Column'
import ColumnTitle from './ColumnTitle'

export const Column = ({ day, tasks }: ColumnProps, ref) => {
  const columnContainerRef = useRef<HTMLDivElement>(null)
  // bind draggable
  const hadBindDropRef = useRef(false)

  const app = useAtomValue(appAtom)
  const { currentGraph } = useAtomValue(logseqAtom)
  const settings = useAtomValue(settingsAtom)
  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'

  const today = dayjs()
  const dateStr = day.format('MM-DD ddd')

  const isToday = day.isSame(today, 'day')
  const doneTasks = tasks.filter((task) => task.status === 'done')
  const undoneTasks = tasks.filter((task) => task.status !== 'done')
  const _dayTasks = undoneTasks.concat(doneTasks)
  const estimatedTime = _dayTasks.reduce((acc, task) => {
    return acc + (task.estimatedTime ?? DEFAULT_ESTIMATED_TIME)
  }, 0)
  const actualTime = _dayTasks.reduce((acc, task) => {
    return acc + (task.actualTime ?? task.estimatedTime ?? DEFAULT_ESTIMATED_TIME)
  }, 0)

  const [editTaskModal, setEditTaskModal] = useState<{
    open: boolean
    task?: AgendaTask
  }>({
    open: false,
  })

  const { updateTaskData, addNewTask, deleteTask } = useAgendaTasks()
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
    updateBlockTaskStatus(task, status)
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
    deleteBlockDateInfo(taskId)
  }

  useImperativeHandle(ref, () => ({
    scrollIntoView: () => {
      columnContainerRef.current?.scrollIntoView({ block: 'nearest', inline: 'start' })
    },
    // 你可以在这里添加更多你需要暴露给父组件的方法或属性
  }))

  useEffect(() => {
    if (app.view === 'tasks' && !hadBindDropRef.current && columnContainerRef.current) {
      new ThirdPartyDraggable(columnContainerRef.current, {
        itemSelector: '.droppable-task-element',
        mirrorSelector: '.dragged-mirror-element',
      })
      hadBindDropRef.current = true
    }
    return () => {
      hadBindDropRef.current = false
    }
  }, [app.view])

  return (
    <>
      <div key={dateStr} className="w-[265px] shrink-0 mt-2 flex flex-col" id={dateStr} ref={columnContainerRef}>
        {/* ========= Title ========= */}
        <ColumnTitle day={day} />

        {/* ========= Progress ========= */}
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

        {/* ========= Add a task Button ========= */}
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
            updateBlockDateInfo({
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
                className={cn('bg-white rounded-md p-2 hover:shadow whitespace-pre-wrap cursor-pointer group/card', {
                  'bg-[#edeef0] opacity-80': task.status === 'done',
                  // 循环任务及多天任务不能拖拽
                  'droppable-task-element': !editDisabled && !isMultipleDays,
                })}
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
                              backgroundColor: groupType === 'page' ? task.project.bgColor : task?.filters?.[0]?.color,
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
    </>
  )
}
