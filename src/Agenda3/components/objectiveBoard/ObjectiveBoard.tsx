import { useAtomValue } from 'jotai'
import { GoGoal } from 'react-icons/go'

import { cn } from '@/util/util'

import { appAtom } from '../../models/app'
import { agendaObjectivesAtom } from '../../models/entities/objectives'
import ObjectiveCard from '../kanban/taskCard/ObjectiveCard'
import EditObjectiveModal from '../modals/ObjectiveModal/EditObjectiveModal'
import AddObjectiveCard from './AddObjectiveCard'

const ObjectiveBoard = () => {
  const allObjectives = useAtomValue(agendaObjectivesAtom)
  const { objectivePeriod } = useAtomValue(appAtom)
  if (!objectivePeriod) return null

  const { type: periodType, number: periodNumber, year: periodYear } = objectivePeriod
  const objectives = allObjectives.filter((o) => {
    const { type, number, year } = o.objective
    return type === periodType && number === periodNumber && year === periodYear
  })

  return (
    <div className={cn('flex h-full w-[290px] flex-col border-l bg-gray-50 pl-2 pr-2 shadow-md')}>
      <div className="relative flex h-[44px] items-center gap-1.5 after:absolute after:bottom-0 after:h-1 after:w-full after:shadow">
        <GoGoal /> Objective{' '}
        <span className="text-xs text-gray-400">
          {objectivePeriod.type}-{objectivePeriod.number}
        </span>
      </div>

      <AddObjectiveCard period={objectivePeriod} key={periodType + periodNumber + periodYear} />

      <div>
        {objectives.map((o) => (
          <ObjectiveCard key={o.id} objective={o} />
        ))}
      </div>
    </div>
  )
}

export default ObjectiveBoard
