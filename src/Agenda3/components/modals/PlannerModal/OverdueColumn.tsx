import React from 'react'
import { ReactSortable } from 'react-sortablejs'

import type { AgendaTaskWithStart } from '@/types/task'
import { cn } from '@/util/util'

import TaskCard from '../../kanban/taskCard/TaskCard'

const OverdueColumn = ({ tasks }: { tasks: AgendaTaskWithStart[] }) => {
  return (
    <div className="w-[281px] shrink-0 mt-2 flex flex-col bg-gray-300 px-2 py-2 rounded-md">
      <div className="flex items-center justify-center mb-2">
        <div className="text-2xl relative">
          <span className="uppercase">Overdue</span>
        </div>
      </div>
      <ReactSortable
        className={cn('flex flex-col gap-2 flex-1 overflow-y-auto hide-scroll-bar')}
        group="planner"
        dragClass="dragged-mirror-element"
        draggable=".droppable-task-element"
        list={tasks}
        setList={(list) => {}}
      >
        {tasks.map((task) => {
          return <TaskCard key={task.id} task={task} />
        })}
      </ReactSortable>
    </div>
  )
}

export default OverdueColumn
