import type { IEvent as IGanttEvent, IGroup } from '@/packages/Gantt/type'
import { getInitalSettings } from '@/util/baseInfo'
import { ICustomCalendar } from '@/util/type'
import { atom } from 'jotai'
import { categorizeTask } from '@/util/schedule'
import { journalEventsAtom, projectEventsAtom } from './events'
import { transformEventToGanttEvent } from '@/helper/transform'

const MOCK_PROJECTS: IGroup[] = [
  { id: '111', title: 'project1', events: [ { title: 'xxxxxxx', start: '2022-05-03', end: '2022-05-04', id: 'yyyy' } ], milestones: [ {start: '2022-05-07', end: '2022-05-07', title: 'milesttttsfasfsadfasffdasf', 'id': 'xxx'} ], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
  { id: '222', title: 'project1', events: [], milestones: [], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
  { id: '333', title: 'project1', events: [], milestones: [], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
 ]

export const ganttDataAtom = atom<IGroup[] | null>((get) => {
  if (import.meta.env.DEV) return MOCK_PROJECTS
  const { projectList = [], journal } = getInitalSettings()
  const enabledCalendarList: ICustomCalendar[] = [journal! as ICustomCalendar].concat(projectList)?.filter(calendar => calendar?.enabled)
  const ganttData: IGroup[] = enabledCalendarList.map(calendar => {
    const calendarId = calendar.id
    const events = calendar.id === 'Journal' ? get(journalEventsAtom) : get(projectEventsAtom).get(calendarId)
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