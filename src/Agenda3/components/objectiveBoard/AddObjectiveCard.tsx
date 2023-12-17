import { IoAddCircleOutline } from 'react-icons/io5'

import type { AgendaEntityObjective } from '@/types/objective'
import { cn } from '@/util/util'

import CreateObjectiveModal from '../modals/ObjectiveModal/CreateObjectiveModal'

const AddObjectiveCard = ({ period }: { period: AgendaEntityObjective }) => {
  return (
    <CreateObjectiveModal initialData={{ objective: period }}>
      <div
        className={cn(
          'group my-2 flex cursor-pointer items-center justify-between rounded-md bg-white p-2 text-sm text-gray-400 shadow',
        )}
      >
        <div className="flex items-center gap-1">
          <IoAddCircleOutline />
          <span className={cn('transition-opacity group-hover:opacity-100')}>Add an objective</span>
        </div>
      </div>
    </CreateObjectiveModal>
  )
}

export default AddObjectiveCard
