import { ThirdPartyDraggable } from '@fullcalendar/interaction'
import { Progress } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtomValue } from 'jotai'
import { useEffect, useImperativeHandle, useRef } from 'react'
import React from 'react'
import { ReactSortable } from 'react-sortablejs'

import { updateBlockDateInfo } from '@/Agenda3/helpers/block'
import { track } from '@/Agenda3/helpers/umami'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import { appAtom } from '@/Agenda3/models/app'
import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { AgendaTaskWithStart } from '@/types/task'
import { cn, replaceDateInfo } from '@/util/util'

import AddTaskCard from './AddTaskCard'
import ColumnTitle from './ColumnTitle'
import type { KanBanItem } from './KanBan'
import TaskCard from './taskCard/TaskCard'

export type ColumnProps = { day: Dayjs; tasks: AgendaTaskWithStart[]; allKanbanItems: KanBanItem[] }
const Column = ({ day, tasks, allKanbanItems }: ColumnProps, ref) => {
  const columnContainerRef = useRef<HTMLDivElement>(null)
  // bind draggable
  const hadBindDropRef = useRef(false)

  const app = useAtomValue(appAtom)

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

  const { updateEntity } = useAgendaEntities()

  const onAddTaskByDrag = async (sortableEvent) => {
    console.log('[faiz:] === kanban onAdd', sortableEvent)
    const id = sortableEvent?.item?.dataset?.id
    const task = allKanbanItems.find((task) => task.id === id)
    if (!task || !id) return logseq.UI.showMsg('task id not found', 'error')
    let startDay = day
    // remain time info
    if (task.allDay === false) {
      startDay = replaceDateInfo(task.start, day)
    }
    updateEntity({
      type: 'task-date',
      id,
      data: {
        start: startDay,
        allDay: task.allDay,
      },
    })
    track('KanBan: Drag Task')
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
      <div key={dateStr} className="mt-2 flex w-[265px] shrink-0 flex-col" id={dateStr} ref={columnContainerRef}>
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

        {/* ========= Add a task Card ========= */}
        <AddTaskCard
          isGray={undoneTasks.length === 0}
          day={day}
          actualTime={actualTime}
          estimatedTime={estimatedTime}
        />

        {/* ========= Tasks List ========= */}
        <ReactSortable
          forceFallback // 该属性如果不加就无法与 fullcalendar 交互
          className={cn('flex flex-1 flex-col gap-2 overflow-y-auto', { 'pb-28': _dayTasks.length === 0 })}
          group="shared"
          dragClass="dragged-mirror-element"
          draggable=".droppable-task-element"
          list={_dayTasks}
          // onMove={(event, originalEvent) => {
          //   console.log('[faiz:] === xxx onMove', event)
          //   console.log('[faiz:] === xxx originalEvent', originalEvent)
          //   return true
          // }}
          setList={() => {
            // console.log(`[faiz:] === setList ${day.format('MM-DD ddd')}`, list)
          }}
          onAdd={onAddTaskByDrag}
        >
          {_dayTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </ReactSortable>
      </div>

      {/* Daily Review Modal */}
    </>
  )
}

export type ColumnHandle = {
  scrollIntoView: () => void
}
export default React.forwardRef<ColumnHandle, ColumnProps>(Column)
