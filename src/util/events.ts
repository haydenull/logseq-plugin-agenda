import { transformBlockToEvent } from './../helper/transform';
import { DEFAULT_CALENDAR_STYLE } from '@/constants/style'
import type { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import dayjs from 'dayjs'
import { getInitalSettings } from './baseInfo'
import { pureTaskBlockContent } from './logseq'
import { deleteProjectTaskTime, fillBlockReference, getAgendaCalendars, getProjectTaskTime, getTimeInfo, isOverdue, removeTimeInfo } from './schedule'
import { ICustomCalendar } from './type'


export const getEventTimeInfo = (block: BlockEntity): {
  start: string
  end?: string
  allDay: boolean
  timeFrom: 'startProperty' | 'customLink' | 'scheduledProperty' | 'deadlineProperty' | 'journal' | 'refs'
} | null => {

  // start end properties date(adapt agenda calendar)
  const { start, end } = block.properties
  if (start && end) {
    if (start?.length >= 16) return { start: dayjs(start, 'YYYY-MM-DD HH:mm').toISOString(), end: dayjs(end, 'YYYY-MM-DD HH:mm').toISOString(), allDay: false, timeFrom: 'startProperty' }
    return { start: dayjs(start, 'YYYY-MM-DD').toISOString(), end: dayjs(end, 'YYYY-MM-DD').toISOString(), allDay: true, timeFrom: 'startProperty' }
  }

  // custom link date
  const projectTimeInfo = getProjectTaskTime(block.content)
  if (projectTimeInfo) return { start: projectTimeInfo.start, end: projectTimeInfo.end, allDay: projectTimeInfo.allDay !== 'false', timeFrom: 'customLink' }

  // scheduled date
  if (block.scheduled) {
    const dateString = block.content?.split('\n')?.find(l => l.startsWith(`SCHEDULED:`))?.trim()
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString!)?.[1] || ''
    if (time) return { start: dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm').toISOString(), allDay: false, timeFrom: 'scheduledProperty' }
    return { start: dayjs('' + block.scheduled, 'YYYYMMDD').toISOString(), allDay: true, timeFrom: 'scheduledProperty' }
  }

  // deadline date
  if (block.deadline) {
    const dateString = block.content?.split('\n')?.find(l => l.startsWith(`DEADLINE:`))?.trim()
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString!)?.[1] || ''
    if (time) return { start: dayjs(`${block.deadline} ${time}`, 'YYYYMMDD HH:mm').toISOString(), allDay: false, timeFrom: 'deadlineProperty' }
    return { start: dayjs('' + block.deadline, 'YYYYMMDD').toISOString(), allDay: true, timeFrom: 'deadlineProperty' }
  }

  // refs date
  const refsDatePage = block.refs?.find(page => Boolean(page?.['journal-day']))
  if (refsDatePage) return { start: dayjs(refsDatePage?.['journal-day'], 'YYYYMMDD').toISOString(), allDay: true, timeFrom: 'refs' }

  // journal date
  const isJournal = Boolean(block?.page?.journalDay)
  if (isJournal) {
    const content = pureTaskBlockContent(block)
    const { start, end } = getTimeInfo(content)
    if (start && end) return { start: dayjs(`${block?.page?.journalDay} ${start}`, 'YYYYMMDD HH:mm').toISOString(), end: dayjs(`${block?.page?.journalDay} ${end}`, 'YYYYMMDD HH:mm').toISOString(), allDay: false, timeFrom: 'journal' }
    if (start && !end) return { start: dayjs(`${block?.page?.journalDay} ${start}`, 'YYYYMMDD HH:mm').toISOString(), allDay: false, timeFrom: 'journal' }
    return { start: dayjs(block?.page?.journalDay + '', 'YYYYMMDD').toISOString(), allDay: true, timeFrom: 'journal' }
  }

  // no date info
  return null
}

export type IEvent = BlockEntity & {
  rawTime?: {
    start: string
    end?: string
    allDay: boolean
    timeFrom: 'startProperty' | 'customLink' | 'scheduledProperty' | 'deadlineProperty' | 'journal' | 'refs'
  }
  addOns: {
    showTitle: string
    start?: string
    end?: string
    allDay?: boolean
    status: 'todo' | 'doing' | 'done' | 'canceled'
    isOverdue: boolean
    isJournal: boolean
    calendarConfig?: ICustomCalendar
    type: 'task' | 'milestone'
  }
}
export type IPageEvent = {
  tasks: {
    withTime: IEvent[]
    noTime: IEvent[]
  },
  milestones: {
    withTime: IEvent[]
    noTime: IEvent[]
  },
}
export const genDefaultProjectEvents = (): IPageEvent => ({
  tasks: {
    withTime: [],
    noTime: [],
  },
  milestones: {
    withTime: [],
    noTime: [],
  },
})
export const getInternalEvents = async () => {
  const tasks = await logseq.DB.q(`(task todo doing done later now canceled)`)
  if (!tasks || tasks?.length === 0) return null
  // const agendaCalendars = await getAgendaCalendars()
  const settings = getInitalSettings()

  let fullEvents: IPageEvent = genDefaultProjectEvents()
  let journalEvents: IPageEvent = genDefaultProjectEvents()
  const projectEventsMap = new Map<string, IPageEvent>()

  const promiseList = (tasks as BlockEntity[]).map(async task => {

    const event = await transformBlockToEvent(task, settings)
    const isMilestone = event.addOns.type === 'milestone'
    const time = event.rawTime
    const isJournal = event.addOns.isJournal

    if (isMilestone) {
      if (time) {
        fullEvents.milestones.withTime.push(event)
      } else {
        fullEvents.milestones.noTime.push(event)
      }
    } else {
      if (time) {
        fullEvents.tasks.withTime.push(event)
      } else {
        fullEvents.tasks.noTime.push(event)
      }
    }


    if (isJournal) {
      // journal
      if (isMilestone) {
        if (time) {
          journalEvents.milestones.withTime.push(event)
        } else {
          journalEvents.milestones.noTime.push(event)
        }
      } else {
        if (time) {
          journalEvents.tasks.withTime.push(event)
        } else {
          journalEvents.tasks.noTime.push(event)
        }
      }
    } else {
      // project
      const pageName = task.page?.originalName
      const projectEvents = projectEventsMap.get(pageName) || genDefaultProjectEvents()
      if (isMilestone) {
        if (time) {
          projectEvents.milestones.withTime.push(event)
        } else {
          projectEvents.milestones.noTime.push(event)
        }
      } else {
        if (time) {
          projectEvents.tasks.withTime.push(event)
        } else {
          projectEvents.tasks.noTime.push(event)
        }
      }
      projectEventsMap.set(pageName, projectEvents)
    }
  })

  await Promise.all(promiseList)

  return { journalEvents, projectEventsMap, fullEvents }
}