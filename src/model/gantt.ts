import type { IEvent as IGanttEvent, IGroup } from '@/packages/Gantt/type'
import { getInitalSettings } from '@/util/baseInfo'
import { ICustomCalendar } from '@/util/type'
import { atom } from 'jotai'
import { categorizeTask } from '@/util/schedule'
import { journalEventsAtom, projectEventsAtom } from './events'
import { transformEventToGanttEvent } from '@/helper/transform'
import dayjs from 'dayjs'

export const ganttDataAtom = atom<IGroup[] | null>((get) => {
  const { projectList = [], journal } = getInitalSettings()
  const enabledCalendarList: ICustomCalendar[] = [journal! as ICustomCalendar].concat(projectList)?.filter(calendar => calendar?.enabled)
  const ganttData: IGroup[] = enabledCalendarList.map(calendar => {
    const calendarId = calendar.id
    let events = get(projectEventsAtom).get(calendarId)
    if (calendar.id === 'Journal') {
      const journalProject = get(journalEventsAtom)
      const begin = dayjs().subtract(1, 'week')
      const end = dayjs().add(1, 'year')
      events = {
        tasks: {
          withTime: journalProject.tasks?.withTime?.filter(val => dayjs(val.addOns.start).isBetween(begin, end)),
          noTime: [],
        },
        milestones: {
          withTime: journalProject.milestones?.withTime?.filter(val => dayjs(val.addOns.start).isBetween(begin, end)),
          noTime: [],
        },
      }
    }
    const calendarConfig = calendar.id === 'Journal' ? journal : projectList.find(calendar => calendar.id === calendarId)
    if (!events) {
      return {
        id: calendarId,
        title: calendarId,
        amount: {
          doing: 0,
          todo: 0,
          done: 0,
        },
        style: {
          bgColor: calendar.bgColor || '#fff',
          borderColor: calendar.borderColor || '#fff',
          color: calendar.textColor || '#000',
        },
        events: [],
        milestones: [],
      }
    }

    const { doing, todo, done } = categorizeTask(events?.tasks?.withTime)

    return {
      id: calendarId,
      title: calendarId,
      amount: {
        doing: doing?.length,
        todo: todo?.length,
        done: done?.length,
      },
      style: {
        bgColor: calendarConfig?.bgColor || '#fff',
        borderColor: calendarConfig?.borderColor || '#fff',
        color: calendarConfig?.textColor || '#000',
      },
      events: events.tasks.withTime.map(transformEventToGanttEvent),
      milestones: events.milestones.withTime.map(transformEventToGanttEvent),
    }
  })
  .filter(function<T>(item: T | null): item is T {return Boolean(item)})

  return ganttData
})