import dayjs, { type Dayjs } from 'dayjs'
import { IoAddCircleOutline } from 'react-icons/io5'

import { minutesToHHmm } from '@/Agenda3/helpers/fullCalendar'
import { track } from '@/Agenda3/helpers/umami'
import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import { cn } from '@/util/util'

import TaskModal from '../modals/TaskModal'

const AddTaskCard = ({
  day,
  actualTime,
  estimatedTime,
  isGray,
}: {
  day: Dayjs
  isGray: boolean
  actualTime?: number
  estimatedTime: number
}) => {
  const isToday = day.isSame(dayjs(), 'day')
  const { addNewTask } = useAgendaTasks()

  return (
    <TaskModal onOk={addNewTask} info={{ type: 'create', initialData: { startDateVal: day } }}>
      <div
        onClick={() => track('KanBan: Add Task Button', { today: String(isToday) })}
        className={cn(
          'bg-white rounded-md p-2 my-2 text-gray-400 text-sm flex items-center hover:shadow cursor-pointer group justify-between',
          {
            'bg-[#edeef0]': isGray,
          },
        )}
      >
        <div className="flex items-center gap-1">
          <IoAddCircleOutline />
          <span className={cn('group-hover:opacity-100 transition-opacity', { 'opacity-0': !isToday })}>
            Add a task
          </span>
        </div>
        {actualTime ? (
          <div className="bg-gray-200 rounded text-xs px-1 py-0.5 text-[10px]">
            {minutesToHHmm(actualTime)} / {minutesToHHmm(estimatedTime)}
          </div>
        ) : (
          <div className="bg-gray-200 rounded text-xs px-1 py-0.5 text-[10px]">{minutesToHHmm(estimatedTime)}</div>
        )}
      </div>
    </TaskModal>
  )
}

export default AddTaskCard
