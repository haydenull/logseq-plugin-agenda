import React from 'react'
import { useTranslation } from 'react-i18next'
import { ReactSortable } from 'react-sortablejs'

import type { AgendaTaskWithStart } from '@/types/task'
import { cn } from '@/util/util'

import TaskCard from '../../kanban/taskCard/TaskCard'

const OverdueColumn = ({ tasks }: { tasks: AgendaTaskWithStart[] }) => {
  const { t } = useTranslation()
  return (
    <div className="mt-2 flex w-[281px] shrink-0 flex-col rounded-md bg-gray-300 px-2 py-2">
      <div className="mb-2 flex items-center justify-center">
        <div className="relative text-2xl">
          <span className="uppercase">{t('Overdue')}</span>
        </div>
      </div>
      <ReactSortable
        className={cn('hide-scroll-bar flex flex-1 flex-col gap-2 overflow-y-auto')}
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
