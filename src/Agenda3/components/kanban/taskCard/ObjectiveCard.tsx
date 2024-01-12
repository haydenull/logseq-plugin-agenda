import { useAtomValue } from 'jotai'
import React from 'react'
import { GoGoal } from 'react-icons/go'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { IoCheckmark } from 'react-icons/io5'

import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { settingsAtom } from '@/Agenda3/models/settings'
import type { AgendaObjectiveWithTasks } from '@/types/objective'
import { cn } from '@/util/util'

import Group from '../../Group'
import LogseqLogo from '../../icons/LogseqLogo'
import EditObjectiveModal from '../../modals/ObjectiveModal/EditObjectiveModal'

const ObjectiveCard = ({ objective }: { objective: AgendaObjectiveWithTasks }) => {
  const { currentGraph } = useAtomValue(logseqAtom)
  const settings = useAtomValue(settingsAtom)
  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'

  return (
    <EditObjectiveModal initialData={objective}>
      <div
        className={cn(
          'group/card relative shrink-0 cursor-pointer overflow-hidden whitespace-pre-wrap rounded-md bg-white p-2 shadow',
          {
            'bg-[#edeef0] opacity-80': objective.status === 'done',
          },
        )}
      >
        <GoGoal
          className={cn('absolute -right-3 top-1 text-8xl text-gray-100', {
            'text-[#e2e3e6]': objective.status === 'done',
          })}
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {objective.status === 'done' ? (
                <IoIosCheckmarkCircle
                  className="cursor-pointer text-xl text-gray-300"
                  // onClick={(e) => onClickTaskMark(e, task, 'todo')}
                />
              ) : (
                <IoIosCheckmarkCircleOutline
                  className="cursor-pointer text-xl text-gray-300"
                  // onClick={(e) => onClickTaskMark(e, task, 'done')}
                />
              )}

              <div
                className="cursor-pointer text-gray-300 opacity-0 transition-opacity group-hover/card:opacity-100"
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
            className={cn('my-0.5 text-gray-600', {
              'line-through': objective.status === 'done',
            })}
          >
            {objective.showTitle}
          </div>
          <Group task={objective} type={groupType} />
          {objective.tasks ? (
            <>
              <div className="mt-2 border-t border-gray-100"></div>
              <div>
                {objective.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-1">
                    <IoCheckmark className={cn(task.status === 'done' ? 'text-green-500' : 'text-gray-400')} />
                    <span>{task.showTitle}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </EditObjectiveModal>
  )
}

export default ObjectiveCard
