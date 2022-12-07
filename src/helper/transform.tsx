import { DEFAULT_CALENDAR_STYLE } from '@/constants/style'
import { getInitalSettings } from '@/util/baseInfo'
import { ICategory, ISettingsForm } from '@/util/type'
import { getEventTimeInfo, IEvent } from '@/util/events'
import type { IEvent as IGanttEvent, IGroup } from '@/packages/Gantt/type'
import dayjs from 'dayjs'
import { getPageData, pureTaskBlockContent } from '@/util/logseq'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'
import { deleteProjectTaskTime, fillBlockReference, isOverdue, judgeIsMilestone, removeTimeInfo } from '@/util/schedule'
import { format } from 'date-fns'
import { getPomodoroInfo, removePomodoroInfo } from './pomodoro'
import { md } from './md'
import { CALENDAR_DONN_TASK_ALLDAY_STYLE, CALENDAR_DONN_TASK_TIME_STYLE } from '@/util/constants'

/** ========== calendar schedules ========== */
export const transformTaskEventToSchedule = (block: IEvent) => {
  const { journal, projectList = [] } = getInitalSettings()

  let category: ICategory = block?.addOns?.allDay ? 'allday' : 'time'
  if (block?.addOns?.isOverdue) category = 'task'

  let calendarStyle: { bgColor: string; textColor: string; borderColor: string; } | undefined = block?.addOns?.isJournal ? journal : projectList.find(project => project.id === block?.addOns?.project)
  if (!calendarStyle) calendarStyle = DEFAULT_CALENDAR_STYLE

  const doneStyle = block.addOns.allDay ? CALENDAR_DONN_TASK_ALLDAY_STYLE : CALENDAR_DONN_TASK_TIME_STYLE

  return {
    id: block.uuid,
    calendarId: block.addOns.project,
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
    customStyle: ['done', 'canceled'].includes(block.addOns.status) ? doneStyle : '',
    isReadOnly: false,
  }
}
export const transformMilestoneEventToSchedule = (block: IEvent) => {
  const { journal, projectList = [] } = getInitalSettings()

  let calendarStyle: { bgColor: string; textColor: string; borderColor: string; } | undefined = block?.addOns?.isJournal ? journal : projectList.find(project => project.id === block?.addOns?.project)
  if (!calendarStyle) calendarStyle = DEFAULT_CALENDAR_STYLE

  const doneStyle = block.addOns.allDay ? CALENDAR_DONN_TASK_ALLDAY_STYLE : CALENDAR_DONN_TASK_TIME_STYLE

  return {
    id: block.uuid,
    calendarId: block.addOns.isJournal ? 'Journal' : block.addOns.project,
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
    customStyle: ['done', 'canceled'].includes(block.addOns.status) ? doneStyle : '',
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
    completed: event.addOns.status === 'done',
    detailPopup: (<div className="text-xs">
      <div className="font-bold text-base my-2">{event.addOns.showTitle}</div>
      <div className="my-2">{`${dayStart.format('YYYY.MM.DD')} - ${dayEnd.format('YYYY.MM.DD')}`}</div>
      <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: md.render(event.content) }}></div>

      <a onClick={async () => {
        const { id: pageId, originalName } = event.page || {}
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
  // replace page
  const page = block?.page?.originalName ? block.page : await logseq.Editor.getPage(block.page.id)
  block.page = page!
  const time = getEventTimeInfo(block)
  const pomodoros = getPomodoroInfo(block.content, block.format)
  const isMilestone = judgeIsMilestone(block)
  const projectPage = block.refs?.find(ref => ref.originalName === block.properties?.project?.[0])
  const isJournal = projectPage
                      ? Boolean(projectPage?.journalDay)
                      : Boolean(page?.journalDay)

  let event: IEvent = time
                        ? { ...block, rawTime: time, addOns: { showTitle: '', project: 'Journal', contentWithoutTime: '', end: '', status: 'todo', isOverdue: false, isJournal: false, type: 'task', ...time } }
                        : { ...block, addOns: { showTitle: '', project: 'Journal', contentWithoutTime: '', status: 'todo', isOverdue: false, isJournal: false, type: 'task' } }

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
  if (isMilestone) showTitle = showTitle?.replace('#milestone', '')?.trim()
  event.addOns.showTitle = await fillBlockReference(showTitle?.split('\n')?.[0]?.trim())

  // add end time
  if (time && !time.end) {
    if (time.allDay) {
      event.addOns.end = time.start
    } else {
      event.addOns.end = dayjs(event.addOns.start).add(defaultDuration.value, defaultDuration.unit as dayjs.ManipulateType).format()
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

  // add type
  if (isMilestone) event.addOns.type = 'milestone'

  // add pomodoros
  event.addOns.pomodoros = pomodoros || []

  // add project
  event.addOns.project = isJournal
                          ? 'Journal'
                          : (projectPage?.originalName || page?.originalName)
  // add project page
  event.addOns.projectPage = projectPage || page

  // add calendar config
  const project = projectList?.find(project => project.id === event.addOns.project)
  if (project) {
    event.addOns.calendarConfig = project
  } else if (isJournal) {
    event.addOns.calendarConfig = journal
  } else {
    event.addOns.calendarConfig = {
      id: event.addOns.project,
      enabled: true,
      ...DEFAULT_CALENDAR_STYLE,
    }
  }

  return event
}