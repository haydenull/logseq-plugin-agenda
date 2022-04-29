import { atom } from 'jotai'
import type { ISchedule } from 'tui-calendar'
import { genScheduleWithCalendarMap } from '@/util/schedule'

export const projectSchedulesAtom = atom<ISchedule[]>([]) // include overdue schedules
export const subscriptionSchedulesAtom = atom<ISchedule[]>([])

export const schedulesAtom = atom((get) => get(projectSchedulesAtom).concat(get(subscriptionSchedulesAtom)))

export const projectRawSchedulesAtom = atom<ISchedule[]>((get) => {
  return get(projectSchedulesAtom).filter(schedule => !schedule.id?.startsWith('overdue-'))
}) // exclude overdue schedules

export const scheduleCalendarMapAtom = atom((get) => {
  return genScheduleWithCalendarMap(get(projectRawSchedulesAtom))
})