import dayjs, { type Dayjs } from 'dayjs'
import React from 'react'
import { ReactSortable } from 'react-sortablejs'

import { updateBlockDateInfo } from '@/Agenda3/helpers/block'
import { track } from '@/Agenda3/helpers/umami'
import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { AgendaObjective, AgendaTask, AgendaTaskWithStart } from '@/types/task'
import { cn, replaceDateInfo } from '@/util/util'

import AddTaskCard from '../../kanban/AddTaskCard'
import ObjectiveCard from '../../kanban/taskCard/ObjectiveCard'
import TaskCard from '../../kanban/taskCard/TaskCard'

const CycleColumn = ({
  cycle,
  tasks,
  objectives,
  allTasks,
}: {
  cycle: 'today' | 'tomorrow' | 'week' | 'month'
  tasks: AgendaTaskWithStart[]
  objectives: AgendaObjective[]
  allTasks: AgendaTask[]
}) => {
  const today = dayjs()
  const dayMap = {
    today,
    tomorrow: today.add(1, 'day'),
    week: today.endOf('week'),
    month: today.endOf('month'),
  }
  const day = dayMap[cycle]
  const isTodayLastDayOfWeek = today.isSame(dayMap.week, 'day')
  const isTodayLastDayOfMonth = today.isSame(dayMap.month, 'day')

  const estimatedTime = tasks.reduce((acc, task) => {
    return acc + (task.estimatedTime ?? DEFAULT_ESTIMATED_TIME)
  }, 0)

  const { updateTaskData } = useAgendaTasks()

  return (
    <div className="w-[281px] shrink-0 mt-2 flex flex-col bg-gray-300 px-2 py-2 rounded-md">
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
          <AddTaskCard day={day} isGray={false} estimatedTime={estimatedTime} />
          <ReactSortable
            forceFallback // 该属性如果不加就无法与 fullcalendar 交互
            className={cn('flex flex-col gap-2 flex-1 overflow-y-auto hide-scroll-bar')}
            group="planner"
            dragClass="dragged-mirror-element"
            draggable=".droppable-task-element"
            list={tasks}
            setList={(list) => {
              // console.log(`[faiz:] === setList ${day.format('MM-DD ddd')}`, list)
            }}
            onAdd={async (sortableEvent) => {
              const id = sortableEvent?.item?.dataset?.id
              const task = allTasks.find((task) => task.id === id)
              if (!task || !id) return logseq.UI.showMsg('task id not found', 'error')
              let startDay = day
              // remain time info
              if (task.allDay === false && task.start) {
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
            {objectives.map((objective) => (
              <ObjectiveCard key={objective.id} objective={objective} />
            ))}
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ReactSortable>
        </>
      )}
    </div>
  )
}

function getCycleText(day: Dayjs, cycle: 'today' | 'tomorrow' | 'week' | 'month') {
  if (cycle === 'today' || cycle === 'tomorrow') return day.format('MMM DD, ddd')
  if (cycle === 'week') return 'W' + day.isoWeek()
  if (cycle === 'month') return day.format('MMMM')
  return ''
}

export default CycleColumn
