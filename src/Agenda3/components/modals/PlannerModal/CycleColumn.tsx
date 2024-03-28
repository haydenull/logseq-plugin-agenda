import dayjs, { type Dayjs } from 'dayjs'
import { useAtomValue } from 'jotai'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ReactSortable } from 'react-sortablejs'

import { track } from '@/Agenda3/helpers/umami'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import { appAtom } from '@/Agenda3/models/app'
import { settingsAtom } from '@/Agenda3/models/settings'
import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { AgendaEntity } from '@/types/entity'
import type { AgendaObjectiveWithTasks } from '@/types/objective'
import type { AgendaTaskWithStart } from '@/types/task'
import { cn, replaceDateInfo } from '@/util/util'

import AddTaskCard from '../../kanban/AddTaskCard'
import ObjectiveCard from '../../kanban/taskCard/ObjectiveCard'
import TaskCard from '../../kanban/taskCard/TaskCard'
import AddObjectiveCard from '../../objectiveBoard/AddObjectiveCard'

const CycleColumn = ({
  cycle,
  tasks,
  objectives,
  allTasks,
}: {
  cycle: 'today' | 'tomorrow' | 'week' | 'month'
  tasks: AgendaTaskWithStart[]
  objectives: AgendaObjectiveWithTasks[]
  allTasks: AgendaEntity[]
}) => {
  const { t } = useTranslation()
  const settings = useAtomValue(settingsAtom)
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

  const { updateEntity } = useAgendaEntities()

  return (
    <div className="mt-2 flex w-[281px] shrink-0 flex-col rounded-md bg-gray-300 px-2 py-2 dark:bg-[#212121]">
      <div className="flex justify-center">
        <div className="relative text-2xl">
          <span className="uppercase">{t(cycle)}</span>
          <span className="absolute -right-[104px] top-1 w-[100px] text-[10px] text-gray-500">
            {getCycleText(day, cycle)}
          </span>
        </div>
      </div>

      {settings.experimental?.objective && cycle === 'week' ? (
        <AddObjectiveCard period={{ type: 'week', year: today.year(), number: today.isoWeek() }} />
      ) : null}
      {settings.experimental?.objective &&
        objectives.map((objective) => <ObjectiveCard key={objective.id} objective={objective} />)}

      {(cycle === 'week' && isTodayLastDayOfWeek) || (cycle === 'month' && isTodayLastDayOfMonth) ? (
        <div className="mt-1 text-center text-gray-500">
          Today is the last day of {cycle}, do not forget to review your tasks.
        </div>
      ) : (
        <>
          <AddTaskCard day={day} isGray={false} estimatedTime={estimatedTime} />
          <ReactSortable
            forceFallback // 该属性如果不加就无法与 fullcalendar 交互
            className={cn('hide-scroll-bar flex flex-1 flex-col gap-2 overflow-y-auto')}
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
              updateEntity({ type: 'task-date', id, data: { start: startDay, allDay: task.allDay } })
              track('KanBan: Drag Task')
            }}
          >
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
