import { DEFAULT_CALENDAR_STYLE } from '@/constants/style'
import { getInitalSettings } from '@/util/baseInfo'
import { ICategory, ICustomCalendar, ISettingsForm } from '@/util/type'
import { genDefaultProjectEvents, getEventTimeInfo, IEvent, IPageEvent } from '@/util/events'
import type { IEvent as IGanttEvent, IGroup } from '@/packages/Gantt/type'
import dayjs from 'dayjs'
import { getPageData, pureTaskBlockContent } from '@/util/logseq'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'
import { deleteProjectTaskTime, fillBlockReference, isOverdue, judgeIsMilestone, removeTimeInfo } from '@/util/schedule'
import { format } from 'date-fns'
import { getPomodoroInfo, removePomodoroInfo } from './pomodoro'

/** ========== calendar schedules ========== */
export const transformTaskEventToSchedule = (block: IEvent) => {
  const { journal, projectList = [] } = getInitalSettings()

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
}
export const transformMilestoneEventToSchedule = (block: IEvent) => {
  const { journal, projectList = [] } = getInitalSettings()

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
    isAllDay: false,
    customStyle: block.addOns.status === 'done' ? 'opacity: 0.6;' : '',
    isReadOnly: false,
  }
}


/** ========= gantt ========= */
export const transformEventToGanttEvent = (event: IEvent): IGanttEvent => {
  const dayStart = dayjs(event.addOns.start)
  const dayEnd = dayjs(event.addOns.end)
  return {
    id: event.uuid,
    title: event.addOns.showTitle,
    start: dayStart.format('YYYY-MM-DD'),
    end: dayEnd.format('YYYY-MM-DD'),
    raw: event,
    detailPopup: (<div className="text-xs">
      <div className="font-bold text-base my-2">{event.addOns.showTitle}</div>
      <div className="my-2">{`${dayStart.format('YYYY.MM.DD hh:mm a')} - ${dayEnd.format('hh:mm a')}`}</div>
      <p className="whitespace-pre-line">{event.content}</p>

      <a onClick={async () => {
        const { id: pageId, originalName } = event || {}
        let pageName = originalName
        // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
        if (!pageName) {
          const page = await getPageData({ id: pageId })
          pageName = page?.originalName
        }
        logseq.Editor.scrollToBlockInPage(pageName, event.uuid)
        logseq.hideMainUI()
      }}>Navigate to block</a>
    </div>)
  }
}


// ========== event ========
export const transformBlockToEvent = async (block: BlockEntity, settings: ISettingsForm) => {
  const { defaultDuration, journal, projectList } = settings
  // const isAgendaCalendar = agendaCalendars.some(calendar => calendar.id === block.page?.originalName)

  // replace page
  const page = block?.page?.originalName ? block.page : await logseq.Editor.getPage(block.page.id)
  block.page = page!
  const time = getEventTimeInfo(block)
  const pomodoros = getPomodoroInfo(block.content, block.format)
  const isMilestone = judgeIsMilestone(block)
  const isJournal = Boolean(page?.journalDay)

  let event: IEvent = time
                        ? { ...block, rawTime: time, addOns: { showTitle: '', contentWithoutTime: '', end: '', status: 'todo', isOverdue: false, isJournal: false, type: 'task', ...time } }
                        : { ...block, addOns: { showTitle: '', contentWithoutTime: '', status: 'todo', isOverdue: false, isJournal: false, type: 'task' } }

  // add show title and contentWithoutTime
  let showTitle = pureTaskBlockContent(block)
  if (time?.timeFrom === 'customLink') showTitle = deleteProjectTaskTime(showTitle.trim())
  if (time?.timeFrom === 'journal' && !time?.allDay) showTitle = removeTimeInfo(showTitle.trim())
  if (time?.timeFrom === 'refs') {
    const { preferredDateFormat } = await logseq.App.getUserConfigs()
    const journalName = format(dayjs(time.start).valueOf(), preferredDateFormat)
    showTitle = showTitle.replace(`[[${journalName}]]`, '')?.trim()
  }
  event.addOns.contentWithoutTime = showTitle
  if (pomodoros) showTitle = removePomodoroInfo(showTitle, block.format)
  event.addOns.showTitle = await fillBlockReference(showTitle?.split('\n')?.[0]?.trim())

  // add end time
  if (time && !time.end) {
    if (time.allDay) {
      event.addOns.end = time.start
    } else {
      event.addOns.end = dayjs(event.addOns.start).add(defaultDuration.value, defaultDuration.unit).toISOString()
    }
  }

  // add status
  if (['DOING', 'NOW'].includes(block.marker)) {
    event.addOns.status = 'doing'
  } else if (block.marker === 'WAITING') {
    event.addOns.status = 'waiting'
  } else if (block.marker === 'DONE') {
    event.addOns.status = 'done'
  } else if (block.marker === 'CANCELED') {
    event.addOns.status = 'canceled'
  }

  // add isOverdue
  if (time && isOverdue(block, event.addOns.end!, time?.allDay)) {
    event.addOns.isOverdue = true
  }

  // add isJournal
  if (isJournal) event.addOns.isJournal = true

  // add calendar config
  const project = projectList?.find(project => project.id === page!.originalName)
  if (project) {
    event.addOns.calendarConfig = project
  } else if (isJournal) {
    event.addOns.calendarConfig = journal
  } else {
    event.addOns.calendarConfig = {
      id: page?.originalName,
      enabled: true,
      ...DEFAULT_CALENDAR_STYLE,
    }
  }

  // add type
  if (isMilestone) event.addOns.type = 'milestone'

  // add pomodoros
  event.addOns.pomodoros = pomodoros || []

  return event
}