import { transformBlockToEvent } from './../helper/transform';
import { DEFAULT_CALENDAR_STYLE } from '@/constants/style'
import type { BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin'
import dayjs from 'dayjs'
import { getInitalSettings } from './baseInfo'
import { pureTaskBlockContent } from './logseq'
import { deleteProjectTaskTime, fillBlockReference, getAgendaCalendars, getProjectTaskTime, getTimeInfo, isOverdue, removeTimeInfo } from './schedule'
import { ICustomCalendar } from './type'
import { IPomodoroInfo } from '@/helper/pomodoro';


export const getEventTimeInfo = (block: BlockEntity): {
  start: string
  end?: string
  allDay: boolean
  timeFrom: 'startProperty' | 'customLink' | 'scheduledProperty' | 'deadlineProperty' | 'journal' | 'refs'
} | null => {

  // start end properties date(adapt agenda calendar)
  const { start, end } = block.properties || {}
  if (start && end) {
    if (start?.length >= 16) return { start: dayjs(start, 'YYYY-MM-DD HH:mm').format(), end: dayjs(end, 'YYYY-MM-DD HH:mm').format(), allDay: false, timeFrom: 'startProperty' }
    return { start: dayjs(start, 'YYYY-MM-DD').format(), end: dayjs(end, 'YYYY-MM-DD').format(), allDay: true, timeFrom: 'startProperty' }
  }

  // custom link date
  const projectTimeInfo = getProjectTaskTime(block.content)
  if (projectTimeInfo) return { start: projectTimeInfo.start, end: projectTimeInfo.end, allDay: projectTimeInfo.allDay !== 'false', timeFrom: 'customLink' }

  // scheduled date
  if (block.scheduled) {
    const dateString = block.content?.split('\n')?.find(l => l.startsWith(`SCHEDULED:`))?.trim()
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString!)?.[1] || ''
    if (time) return { start: dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm').format(), allDay: false, timeFrom: 'scheduledProperty' }
    return { start: dayjs('' + block.scheduled, 'YYYYMMDD').format(), allDay: true, timeFrom: 'scheduledProperty' }
  }

  // deadline date
  if (block.deadline) {
    const dateString = block.content?.split('\n')?.find(l => l.startsWith(`DEADLINE:`))?.trim()
    const time = / (\d{2}:\d{2})[ >]/.exec(dateString!)?.[1] || ''
    if (time) return { start: dayjs(`${block.deadline} ${time}`, 'YYYYMMDD HH:mm').format(), allDay: false, timeFrom: 'deadlineProperty' }
    return { start: dayjs('' + block.deadline, 'YYYYMMDD').format(), allDay: true, timeFrom: 'deadlineProperty' }
  }

  // refs date
  const refsDatePage = block.refs?.find(page => Boolean(page?.journalDay))
  if (refsDatePage) return { start: dayjs(refsDatePage?.journalDay + '', 'YYYYMMDD').format(), allDay: true, timeFrom: 'refs' }

  // journal date
  const isJournal = Boolean(block?.page?.journalDay)
  if (isJournal) {
    const content = pureTaskBlockContent(block)
    const { start, end } = getTimeInfo(content)
    if (start && end) return { start: dayjs(`${block?.page?.journalDay} ${start}`, 'YYYYMMDD HH:mm').format(), end: dayjs(`${block?.page?.journalDay} ${end}`, 'YYYYMMDD HH:mm').format(), allDay: false, timeFrom: 'journal' }
    if (start && !end) return { start: dayjs(`${block?.page?.journalDay} ${start}`, 'YYYYMMDD HH:mm').format(), allDay: false, timeFrom: 'journal' }
    return { start: dayjs(block?.page?.journalDay + '', 'YYYYMMDD').format(), allDay: true, timeFrom: 'journal' }
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
    contentWithoutTime: string
    project: string
    projectPage?: PageEntity
    start?: string
    end?: string
    allDay?: boolean
    status: 'waiting' | 'todo' | 'doing' | 'done' | 'canceled'
    isOverdue: boolean
    isJournal: boolean
    calendarConfig?: ICustomCalendar
    type: 'task' | 'milestone'
    pomodoros?: IPomodoroInfo[]
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
  let tasks = await logseq.DB.datascriptQuery(`
  [:find (pull
    ?block
    [:block/uuid
      :block/parent
      :db/id
      :block/left
      :block/collapsed?
      :block/format
      :block/_refs
      :block/path-refs
      :block/tags
      :block/content
      :block/marker
      :block/priority
      :block/properties
      :block/pre-block?
      :block/scheduled
      :block/deadline
      :block/repeated?
      :block/created-at
      :block/updated-at
      :block/file
      :block/heading-level
      {:block/page
        [:db/id :block/name :block/original-name :block/journal-day :block/journal?]}
      {:block/refs
        [:db/id :block/name :block/original-name :block/journal-day :block/journal?]}])
    :where
    [?block :block/marker ?marker]
    [(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE" "CANCELED"} ?marker)]]
  `)
  if (!tasks || tasks?.length === 0) return null
  const settings = getInitalSettings()
  tasks = tasks.flat()
  if (settings.ignoreTag) {
    tasks = tasks.filter(task => {
      const shouldIgnore = task.refs?.some(ref => ref?.['original-name'] === settings.ignoreTag)
      return !shouldIgnore
    })
  }

  let fullEvents: IPageEvent = genDefaultProjectEvents()
  let journalEvents: IPageEvent = genDefaultProjectEvents()
  const projectEventsMap = new Map<string, IPageEvent>()

  const promiseList = (tasks as BlockEntity[]).map(async task => {

    task = {
      ...task,
      uuid: task.uuid?.['$uuid$'],
      page: {
        ...task.page,
        originalName: task.page?.['original-name'],
        journalDay: task.page?.['journal-day'],
      },
      refs: task.refs?.map(_page => ({
        ..._page,
        journalDay: _page?.['journal-day'],
        originalName: _page?.['original-name'],
      })),
    }

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
      const projectName = event.addOns.project
      const projectEvents = projectEventsMap.get(projectName) || genDefaultProjectEvents()
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
      projectEventsMap.set(projectName, projectEvents)
    }
  })

  await Promise.all(promiseList)

  return { journalEvents, projectEventsMap, fullEvents }
}

export const getEventPomodoroLength = (event: IEvent) => {
  return event.addOns.pomodoros?.reduce((acc, pomo) => {
    return acc + pomo.length
  }, 0) || 0
}