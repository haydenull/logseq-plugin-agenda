import { useSetAtom } from 'jotai'
import React from 'react'
import { GoGoal } from 'react-icons/go'

import { appAtom } from '@/Agenda3/models/app'

const WeekNumber = ({ weekNumber }: { weekNumber: number }) => {
  const setApp = useSetAtom(appAtom)
  const onClick = () => {
    setApp((_app) => ({ ..._app, sidebarType: 'objective' }))
  }
  return (
    <div onClick={onClick} className="faiz-week-number text-xs flex gap-1 items-center cursor-pointer">
      W{weekNumber}
      <GoGoal />
    </div>
  )
}

export default WeekNumber
