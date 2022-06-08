import { DEFAULT_CALENDAR_STYLE } from '@/constants/style'
import { getInitalSettings } from '@/util/baseInfo'
import { ICategory } from '@/util/type'
import { genDefaultProjectEvents, IEvent, IPageEvent } from '@/util/events'
import type { IEvent as IGanttEvent, IGroup } from '@/packages/Gantt/type'
import dayjs from 'dayjs'
import { getPageData } from '@/util/logseq'

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
    isAllDay: !block?.addOns?.isOverdue && block.addOns.allDay,
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