import { useAtom, useAtomValue } from 'jotai'
import { GoGoal } from 'react-icons/go'
import { IoMdClose } from 'react-icons/io'

import { cn } from '@/util/util'

import { appAtom } from '../../models/app'
import { objectivesWithTasksAtom } from '../../models/entities/objectives'
import ObjectiveCard from '../kanban/taskCard/ObjectiveCard'
import AddObjectiveCard from './AddObjectiveCard'

const ObjectiveBoard = () => {
  const allObjectives = useAtomValue(objectivesWithTasksAtom)
  const [app, setApp] = useAtom(appAtom)
  const objectivePeriod = app.objectivePeriod
  if (!objectivePeriod) return null

  const { type: periodType, number: periodNumber, year: periodYear } = objectivePeriod
  const objectives = allObjectives.filter((o) => {
    const { type, number, year } = o.objective
    return type === periodType && number === periodNumber && year === periodYear
  })

  const onClickClose = () => {
    setApp((_app) => ({ ..._app, sidebarType: 'backlog' }))
  }

  return (
    <div className={cn('flex h-full w-[290px] flex-col border-l bg-gray-50 pl-2 pr-2 shadow-md')}>
      <div className="relative flex h-[44px] items-center justify-between after:absolute after:bottom-0 after:h-1 after:w-full after:shadow">
        <div className="flex items-center gap-1.5">
          <GoGoal /> Objective{' '}
          <span className="text-xs text-gray-400">
            {objectivePeriod.type}-{objectivePeriod.number}
          </span>
        </div>
        <IoMdClose className="cursor-pointer" onClick={onClickClose} />
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
