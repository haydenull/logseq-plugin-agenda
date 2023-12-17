import dayjs from 'dayjs'
import { useAtomValue, useSetAtom } from 'jotai'
import React from 'react'
import { GoGoal } from 'react-icons/go'

import { appAtom } from '@/Agenda3/models/app'
import { objectivesWithTasksAtom } from '@/Agenda3/models/entities/objectives'
import { cn } from '@/util/util'

const WeekNumber = ({ weekNumber, date }: { weekNumber: number; date: Date }) => {
  const allObjectives = useAtomValue(objectivesWithTasksAtom)
  const setApp = useSetAtom(appAtom)
  const day = dayjs(date)

  const objectives = allObjectives.filter((o) => {
    const { type, number, year } = o.objective
    return type === 'week' && number === weekNumber && year === day.year()
  })
  const isDone = objectives.every((o) => o.status === 'done')

  const onClick = () => {
    setApp((_app) => ({
      ..._app,
      sidebarType: 'objective',
      objectivePeriod: { type: 'week', number: weekNumber, year: day.year() },
    }))
  }
  return (
    <div
      onClick={onClick}
      className="faiz-week-number flex cursor-pointer items-center gap-1 text-xs hover:text-gray-900"
    >
      W{weekNumber}
      {objectives.length > 0 && <GoGoal className={cn(isDone ? 'text-green-500' : '')} />}
    </div>
  )
}

export default WeekNumber
