import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import { DATE_FORMATTER_FOR_KEY, separateTasksInDay, transformTasksToKanbanTasks } from '@/Agenda3/helpers/task'
import { settingsAtom } from '@/Agenda3/models/settings'
import { recentTasksAtom } from '@/Agenda3/models/tasks'
import { getRecentDaysRange } from '@/constants/agenda'
import type { AgendaTaskWithStart } from '@/types/task'
import { genDays } from '@/util/util'

import Column, { type ColumnHandle } from './Column'

const getRecentDays = () => {
  const [startDay, endDay] = getRecentDaysRange()
  return genDays(startDay, endDay)
}
export type KanBanHandle = {
  scrollToToday: () => void
}
const KanBan = (props, ref) => {
  const kanBanContainerRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef<Record<string, ColumnHandle | null>>({})

  const settings = useAtomValue(settingsAtom)

  const recentTasks = useAtomValue(recentTasksAtom)
  const tasks = transformTasksToKanbanTasks(recentTasks, {
    showFirstEventInCycleOnly: settings.viewOptions?.showFirstEventInCycleOnly,
  })
  const tasksInDay = separateTasksInDay(tasks)
  const days = getRecentDays()

  const scrollToToday = () => {
    const todayDateStr = dayjs().format('MM-DD ddd')
    columnRefs.current[todayDateStr]?.scrollIntoView()
    kanBanContainerRef.current?.scrollBy({ left: -30, behavior: 'smooth' })
  }

  // scroll to today
  useEffect(() => {
    scrollToToday()
  }, [])

  useImperativeHandle(ref, () => ({
    scrollToToday,
  }))

  return (
    <div className="flex gap-8 overflow-auto flex-1 h-full" ref={kanBanContainerRef}>
      {/* ========= Single Day List ========= */}
      {days.map((day) => {
        const dateStr = day.format('MM-DD ddd')
        const columnTasks = tasksInDay.get(day.format(DATE_FORMATTER_FOR_KEY)) || []
        return <Column key={dateStr} ref={(el) => (columnRefs.current[dateStr] = el)} day={day} tasks={columnTasks} />
      })}
    </div>
  )
}

export type KanBanItem = AgendaTaskWithStart & {
  filtered?: boolean
}
export default forwardRef<KanBanHandle>(KanBan)
