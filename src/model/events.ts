import { ISchedule } from 'tui-calendar';
import { getInitalSettings } from '@/util/baseInfo'
import { atom } from 'jotai'
import { genDefaultProjectEvents, IEvent, IPageEvent } from '../util/events'
import { transformMilestoneEventToSchedule, transformTaskEventToSchedule } from '@/helper/transform'
import dayjs from 'dayjs'

export const fullEventsAtom = atom<IPageEvent>(genDefaultProjectEvents())
export const journalEventsAtom = atom<IPageEvent>(genDefaultProjectEvents())
export const projectEventsAtom = atom<Map<string, IPageEvent>>(new Map())


// ========================= calendar schedules =========================
export const fullCalendarSchedulesAtom = atom<Array<ISchedule & { raw: IEvent }>>((get) => {
  const fullEvents = get(fullEventsAtom)

  const tasks = fullEvents.tasks.withTime.map(transformTaskEventToSchedule)
  const milestones = fullEvents.milestones.withTime.map(transformMilestoneEventToSchedule)

  // @ts-ignore
  return tasks.concat(milestones)
})
export const journalCalendarSchedulesAtom = atom((get) => {
  const { journal } = getInitalSettings()
  const full = get(fullCalendarSchedulesAtom)
  return {
    calendarConfig: journal,
    schedules: full.filter(({ calendarId }) => calendarId === 'Journal'),
  }
})
export const projectCalendarSchedulesAtom = atom((get) => {
  const { projectList= [] } = getInitalSettings()
  const full = get(fullCalendarSchedulesAtom)
  return projectList?.map(project => ({
    calendarConfig: project,
    schedules: full.filter(({ calendarId }) => calendarId === project.id),
  }))
})


// ========================= dashboard =========================

// 最近 14 天任务
export const latest14DaysTasksAtom = atom((get) => {
  const events = get(fullEventsAtom)
  const start = dayjs().subtract(14, 'day')
  const end = dayjs()
  return events.tasks.withTime.filter(task => {
    const taskDay = dayjs(task.start as string)
    return taskDay.isBetween(start, end, 'day', '(]')
  })
})
// 今日任务
export const todayTasksAtom = atom((get) => {
  const events = get(fullEventsAtom)
  return events.tasks.withTime.filter(event => {
    if (event.addOns.status === 'canceled') return false
    if (event.addOns.isOverdue) return true
    const start = dayjs(event.addOns.start)
    const end = dayjs(event.addOns.end)
    return dayjs().isBetween(start, end, 'day', '[]')
  }).sort((a, b) => dayjs(a.addOns.start).diff(dayjs(b.addOns.start)))
})