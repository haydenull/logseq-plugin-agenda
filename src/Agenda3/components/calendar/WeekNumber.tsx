import dayjs from 'dayjs'
import { useSetAtom } from 'jotai'
import React from 'react'
import { GoGoal } from 'react-icons/go'

import { appAtom } from '@/Agenda3/models/app'

const WeekNumber = ({ weekNumber, date }: { weekNumber: number; date: Date }) => {
  const setApp = useSetAtom(appAtom)
  const onClick = () => {
    const day = dayjs(date)
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
      <GoGoal />
    </div>
  )
}

export default WeekNumber
