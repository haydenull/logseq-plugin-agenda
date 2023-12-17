import { useAtomValue } from 'jotai'
import React, { useState } from 'react'
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'

import { backlogsAtom } from '@/Agenda3/models/entities/backlogs'
import { thisMonthObjectivesAtom, thisWeekObjectivesAtom } from '@/Agenda3/models/entities/objectives'
import {
  overdueTasksAtom,
  thisMonthExcludeTomorrowTasksAtom,
  thisMonthTasksAtom,
  thisWeekExcludeTomorrowTasksAtom,
  thisWeekTasksAtom,
  todayTasksAtom,
  tomorrowTasksAtom,
} from '@/Agenda3/models/entities/tasks'
import type { AgendaObjectiveWithTasks } from '@/types/objective'
import type { AgendaTaskWithStart } from '@/types/task'
import { cn } from '@/util/util'

import Backlog from '../../Backlog'
import FullScreenModal from '../FullScreenModal'
import CycleColumn from './CycleColumn'
import OverdueColumn from './OverdueColumn'

const PlannerModal = ({
  children,
  triggerClassName,
  type,
}: {
  children: React.ReactNode
  triggerClassName?: string
  type: 'today' | 'tomorrow'
}) => {
  const [open, setOpen] = useState(false)
  const [backlogFolded, setBacklogFolded] = useState(false)

  const backlogTasks = useAtomValue(backlogsAtom)
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
  const allTasks = backlogTasks.concat(tasks, overdueTasks)

  const thisWeekObjectives = useAtomValue(thisWeekObjectivesAtom)
  const thisMonthObjectives = useAtomValue(thisMonthObjectivesAtom)

  const cycles =
    type === 'today' ? (['today', 'week', 'month'] as const) : (['today', 'tomorrow', 'week', 'month'] as const)

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
            'flex h-full w-screen gap-3 overflow-auto bg-gray-50 px-3 pt-8 pb-1',
            backlogFolded ? 'pr-3' : 'pr-[300px]',
          )}
        >
          {/* Overdue */}
          <OverdueColumn tasks={overdueTasks} />
          {/* Cycle */}
          {cycles.map((cycle) => {
            const cycleTasks: AgendaTaskWithStart[] = tasksInCycle[cycle]
            const cycleObjectives: AgendaObjectiveWithTasks[] = objectivesInCycle[cycle] ?? []
            return (
              <CycleColumn
                key={cycle}
                cycle={cycle}
                tasks={cycleTasks}
                objectives={cycleObjectives}
                allTasks={allTasks}
              />
            )
          })}

          {/* sidebar */}
          <div
            className={cn(
              'group/backlog absolute top-0 right-0 h-screen pt-8 transition-all',
              backlogFolded ? 'w-0' : 'w-[290px]',
            )}
          >
            <Backlog bindCalendar={false} />
            <div
              className={cn(
                'absolute -left-[16px] top-0 z-10 flex h-full w-[16px] items-center opacity-0 transition-all group-hover/backlog:opacity-100',
              )}
            >
              <div
                className="flex h-[50px] w-full cursor-pointer items-center rounded-tl rounded-bl border-l border-t border-b bg-[#f0f0f0] text-gray-400 hover:bg-gray-200"
                onClick={() => setBacklogFolded((folded) => !folded)}
              >
                {backlogFolded ? <AiOutlineLeft /> : <AiOutlineRight />}
              </div>
            </div>
          </div>
        </div>
      </FullScreenModal>
    </>
  )
}
export default PlannerModal
