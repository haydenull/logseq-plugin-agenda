import { GoGoal } from 'react-icons/go'

import { cn } from '@/util/util'

const ObjectiveBoard = () => {
  return (
    <div className={cn('w-[290px] h-full border-l pl-2 flex flex-col bg-gray-50 shadow-md')}>
      <div className="h-[44px] flex items-center gap-1.5 relative after:shadow after:absolute after:bottom-0 after:w-full after:h-1">
        <GoGoal /> Objective
      </div>
    </div>
  )
}

export default ObjectiveBoard
