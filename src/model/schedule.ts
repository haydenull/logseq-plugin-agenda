import { atom } from 'jotai'
import type { ISchedule } from 'tui-calendar'
import { genScheduleWithCalendarMap } from '@/util/schedule'
import dayjs from 'dayjs'
import { getInitalSettings } from '@/util/baseInfo'

export const projectSchedulesAtom = atom<ISchedule[]>([]) // include overdue schedules
export const subscriptionSchedulesAtom = atom<ISchedule[]>([])

export const schedulesAtom = atom((get) => get(projectSchedulesAtom).concat(get(subscriptionSchedulesAtom)))

export const projectRawSchedulesAtom = atom<ISchedule[]>((get) => {
  return get(projectSchedulesAtom).filter(schedule => !schedule.id?.startsWith('overdue-'))
}) // exclude overdue schedules

// 按日历分组
export const scheduleCalendarMapAtom = atom((get) => {
  return genScheduleWithCalendarMap(get(projectRawSchedulesAtom))
})

// 今日日程
export const todaySchedulesAtom = atom((get) => {
  const _schedules = get(schedulesAtom)
  console.log('[faiz:] === allSchedulesAtom', _schedules)
  return _schedules.filter(schedule => {
    const start = dayjs(schedule.start as string)
    const end = dayjs(schedule.end as string || start)
    return dayjs().isBetween(start, end, 'day', '[]')
  }).sort((a, b) => dayjs(a.start as string).diff(dayjs(b.start as string)))
})

// 今日任务
export const todayTasksAtom = atom((get) => {
  const _schedules = get(todaySchedulesAtom)
  const { logKey } = getInitalSettings()
  return _schedules
          .filter(schedule => schedule.raw?.marker)
          ?.filter(schedule => logKey?.enabled === false ? true : schedule.calendarId !== logKey?.id)
          ?.filter(schedule => schedule.raw?.category !== 'milestone')
})

// 最近 14 天任务
export const latest14DaysTasksAtom = atom((get) => {
  const _schedules = get(schedulesAtom)
  const _tasks = _schedules.filter(schedule => schedule.raw?.marker)
  const start = dayjs().subtract(14, 'day')
  const end = dayjs()
  return _tasks.filter(task => {
    const taskDay = dayjs(task.start as string)
    return taskDay.isBetween(start, end, 'day', '(]')
  })
})