import { useAtomValue } from 'jotai'
import React from 'react'
import { GoGoal } from 'react-icons/go'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline } from 'react-icons/io'

import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import { formatTaskTitle } from '@/Agenda3/helpers/task'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { settingsAtom } from '@/Agenda3/models/settings'
import type { AgendaObjective } from '@/types/objective'
import { cn } from '@/util/util'

import Group from '../../Group'
import LogseqLogo from '../../icons/LogseqLogo'

const ObjectiveCard = ({ objective }: { objective: AgendaObjective }) => {
  const { currentGraph } = useAtomValue(logseqAtom)
  const settings = useAtomValue(settingsAtom)
  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'

  const showTitle = formatTaskTitle(objective)

  return (
    <div
      key={objective.id}
      className={cn(
        'bg-white rounded-md p-2 hover:shadow whitespace-pre-wrap cursor-pointer group/card relative overflow-hidden shrink-0',
        {
          'bg-[#edeef0] opacity-80': objective.status === 'done',
        },
      )}
    >
      <GoGoal
        className={cn('absolute text-8xl -right-3 top-1 text-gray-100', {
          'text-[#e2e3e6]': objective.status === 'done',
        })}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 items-center">
            {objective.status === 'done' ? (
              <IoIosCheckmarkCircle
                className="text-xl cursor-pointer text-gray-300"
                // onClick={(e) => onClickTaskMark(e, task, 'todo')}
              />
            ) : (
              <IoIosCheckmarkCircleOutline
                className="text-gray-300 text-xl cursor-pointer"
                // onClick={(e) => onClickTaskMark(e, task, 'done')}
              />
            )}

            <div
              className="text-gray-300 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                navToLogseqBlock(objective, currentGraph)
              }}
            >
              <LogseqLogo />
            </div>
          </div>
        </div>
        <div
          className={cn('text-gray-600 my-0.5', {
            'line-through': objective.status === 'done',
          })}
        >
          {showTitle}
        </div>
        <Group task={objective} type={groupType} />
      </div>
    </div>
  )
}

export default ObjectiveCard
