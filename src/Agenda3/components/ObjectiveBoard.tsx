import { useAtomValue } from 'jotai'
import { GoGoal } from 'react-icons/go'

import { type AgendaTaskObjective } from '@/types/objective'
import { cn } from '@/util/util'

import { agendaObjectivesAtom } from '../models/objectives'

const ObjectiveBoard = ({ period }: { period?: AgendaTaskObjective }) => {
  const objectives = useAtomValue(agendaObjectivesAtom)

  return (
    <div className={cn('w-[290px] h-full border-l pl-2 flex flex-col bg-gray-50 shadow-md')}>
      <div className="h-[44px] flex items-center gap-1.5 relative after:shadow after:absolute after:bottom-0 after:w-full after:h-1">
        <GoGoal /> Objective
      </div>
    </div>
  )
}

export default ObjectiveBoard
