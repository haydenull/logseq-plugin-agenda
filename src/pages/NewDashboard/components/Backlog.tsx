import { Draggable } from '@fullcalendar/interaction'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { BsArchive } from 'react-icons/bs'

import { DEFAULT_ESTIMATED_TIME_HHmm } from '@/constants/agenda'
import { backlogTasksAtom } from '@/newModel/tasks'

const Backlog = () => {
  const taskContainerRef = useRef<HTMLDivElement>(null)
  const [tasks] = useAtom(backlogTasksAtom)
  useEffect(() => {
    if (taskContainerRef.current) {
      new Draggable(taskContainerRef.current, {
        itemSelector: '.droppable-task-element',
      })
    }
  }, [tasks.length])
  return (
    <div className="w-[290px] h-full border-l pl-2 flex flex-col bg-gray-50 shadow-md">
      <div className="h-[44px] flex items-center gap-1.5 relative after:shadow after:absolute after:bottom-0 after:w-full after:h-1">
        <BsArchive /> Backlog
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-auto pt-2" ref={taskContainerRef}>
        {tasks.map((task) => (
          <div
            key={task.id}
            className="border rounded px-2 py-1 text-sm text-gray-600 break-all droppable-task-element"
            data-event={JSON.stringify({
              id: task.id,
              title: task.title,
              duration: DEFAULT_ESTIMATED_TIME_HHmm,
            })}
          >
            {task.title}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Backlog
