import { ISchedule } from 'tui-calendar';
import { DEFAULT_CALENDAR_STYLE } from '@/constants/style'
import { getInitalSettings } from '@/util/baseInfo'
import { ICategory } from '@/util/type'
import { atom } from 'jotai'
import { genDefaultProjectEvents, IEvent, IPageEvent } from '../util/events'

export const fullEventsAtom = atom<IPageEvent>(genDefaultProjectEvents())
export const journalEventsAtom = atom<IPageEvent>(genDefaultProjectEvents())
export const projectEventsAtom = atom<Map<string, IPageEvent>>(new Map())


export const calendarSchedules = atom<Array<ISchedule & { raw: IEvent }>>((get) => {
  const fullEvents = get(fullEventsAtom)

  const { journal, projectList = [] } = getInitalSettings()

  const tasks = fullEvents.tasks.withTime.map((block) => {
    let category: ICategory = block?.addOns?.allDay ? 'allday' : 'time'
    if (block?.addOns?.isOverdue) category = 'task'

    let calendarStyle: { bgColor: string; textColor: string; borderColor: string; } | undefined = block?.addOns?.isJournal ? journal : projectList.find(project => project.id === block?.page?.originalName)
    if (!calendarStyle) calendarStyle = DEFAULT_CALENDAR_STYLE

    return {
      id: block.uuid,
      calendarId: block.addOns.isJournal ? 'Journal' : block.page?.originalName,
      title: block.addOns.showTitle,
      body: block.content,
      category,
      dueDateClass: '',
      start: block.addOns.start,
      end: block.addOns.end,
      raw: block,
      color: calendarStyle?.textColor,
      bgColor: calendarStyle?.bgColor,
      borderColor: calendarStyle?.borderColor,
      isAllDay: !block?.addOns?.isOverdue && block.addOns.allDay,
      customStyle: block.addOns.status === 'done' ? 'opacity: 0.6;' : '',
      isReadOnly: false,
    }
  })

  const milestones = fullEvents.milestones.withTime.map((block) => {
    let calendarStyle: { bgColor: string; textColor: string; borderColor: string; } | undefined = block?.addOns?.isJournal ? journal : projectList.find(project => project.id === block?.page?.originalName)
    if (!calendarStyle) calendarStyle = DEFAULT_CALENDAR_STYLE
    return {
      id: block.uuid,
      calendarId: block.addOns.isJournal ? 'Journal' : block.page?.originalName,
      title: block.addOns.showTitle,
      body: block.content,
      category: 'milestone',
      dueDateClass: '',
      start: block.addOns.start,
      end: block.addOns.end,
      raw: block,
      color: calendarStyle?.textColor,
      bgColor: calendarStyle?.bgColor,
      borderColor: calendarStyle?.borderColor,
      isAllDay: !block?.addOns?.isOverdue && block.addOns.allDay,
      customStyle: block.addOns.status === 'done' ? 'opacity: 0.6;' : '',
      isReadOnly: false,
    }
  })

  // @ts-ignore
  return tasks.concat(milestones)
})