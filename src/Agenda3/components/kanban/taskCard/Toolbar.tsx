import { useAtomValue } from 'jotai'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { IoRepeatOutline } from 'react-icons/io5'

import { minutesToHHmm } from '@/Agenda3/helpers/fullCalendar'
import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { AgendaEntity } from '@/types/entity'
import type { AgendaTaskWithStart } from '@/types/task'

import LogseqLogo from '../../icons/LogseqLogo'

const Toolbar = ({
  task,
  groupType,
  onClickMark,
}: {
  task: AgendaTaskWithStart
  groupType: 'page' | 'filter'
  onClickMark: (event: React.MouseEvent, task: AgendaEntity, status: AgendaEntity['status']) => void
}) => {
  const { currentGraph } = useAtomValue(logseqAtom)
  const estimatedTime = task.estimatedTime ?? DEFAULT_ESTIMATED_TIME

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {task.status === 'done' ? (
          <IoIosCheckmarkCircle
            className="cursor-pointer text-xl text-gray-300"
            onClick={(e) => onClickMark(e, task, 'todo')}
          />
        ) : (
          <IoIosCheckmarkCircleOutline
            className="cursor-pointer text-xl text-gray-300"
            onClick={(e) => onClickMark(e, task, 'done')}
          />
        )}
        {task.allDay ? null : (
          <span
            className="rounded px-1 py-0.5 text-[10px] text-white opacity-70"
            style={{
              backgroundColor: groupType === 'page' ? task.project.bgColor : task?.filters?.[0]?.color,
            }}
          >
            {task.start.format('HH:mm')}
          </span>
        )}
        {task.rrule || task.recurringPast ? <IoRepeatOutline className="text-gray-400" /> : null}
        <div
          className="cursor-pointer text-gray-300 opacity-0 transition-opacity group-hover/card:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            navToLogseqBlock(task, currentGraph)
          }}
        >
          <LogseqLogo />
        </div>
      </div>
      <div className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-400">
        {task.status === 'done' ? <span>{minutesToHHmm(task.actualTime ?? estimatedTime)} / </span> : null}
        {minutesToHHmm(estimatedTime)}
      </div>
    </div>
  )
}

export default Toolbar
