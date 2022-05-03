import { IEvent, IGroup } from '@/packages/Gantt/type'
import { getInitalSettings } from '@/util/baseInfo'
import { ICustomCalendar } from '@/util/type'
import { atom } from 'jotai'
import { ISchedule } from 'tui-calendar'
import dayjs from 'dayjs'
import { scheduleCalendarMapAtom } from './schedule'

const MOCK_PROJECTS: IGroup[] = [
  { id: '111', title: 'project1', events: [ { title: 'xxxxxxx', start: '2022-05-03', end: '2022-05-04', id: 'yyyy' } ], milestones: [ {start: '2022-05-03', end: '2022-05-03', title: 'milesttttsfasfsadfasffdasf', 'id': 'xxx'} ], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
  { id: '222', title: 'project1', events: [], milestones: [], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
  { id: '333', title: 'project1', events: [], milestones: [], style: { bgColor: '#fff', borderColor: '#fff', color: '#000' } },
 ]

export const ganttDataAtom = atom<IGroup[] | null>((get) => {
  if (import.meta.env.DEV) return MOCK_PROJECTS
  const { calendarList, subscriptionList, logKey } = getInitalSettings()
  const enabledCalendarList: ICustomCalendar[] = (logKey?.enabled ? [logKey] : []).concat((calendarList as ICustomCalendar[])?.filter(calendar => calendar.enabled))
  const ganttData: IGroup[] = (enabledCalendarList.map(calendar => calendar.id)).map(calendarId => {
    const schedules = get(scheduleCalendarMapAtom).get(calendarId)
    if (!schedules) return null
    const convertScheduleToGanttEvent = (schedule: ISchedule): IEvent => {
      const { raw = {}, start, end, id = '', title = '' } = schedule
      // @ts-ignore
      const dayjsStart = dayjs(start)
      // @ts-ignore
      const dayjsEnd = dayjs(end)
      return {
        id,
        title,
        start: dayjsStart.format('YYYY-MM-DD'),
        end: end ? dayjsEnd.format('YYYY-MM-DD') : dayjsStart.format('YYYY-MM-DD'),
        raw: {
          blockData: raw,
          calendarSchedule: schedule,
        },
        // detailPopup: (<div className="text-xs">
        //   <div className="font-bold text-base my-2">{title}</div>
        //   <div className="my-2">{`${dayjsStart.format('YYYY.MM.DD hh:mm a')} - ${dayjsEnd.format('hh:mm a')}`}</div>
        //   <p className="whitespace-pre-line">{raw.content}</p>

        //   <a onClick={async () => {
        //     const rawData: any = raw
        //     const { id: pageId, originalName } = rawData?.page || {}
        //     let pageName = originalName
        //     // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
        //     if (!pageName) {
        //       const page = await getPageData({ id: pageId })
        //       pageName = page?.originalName
        //     }
        //     const { uuid: blockUuid } = await logseq.Editor.getBlock(rawData.id) || { uuid: '' }
        //     logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
        //     logseq.hideMainUI()
        //   }}>Navigate to block</a>
        // </div>)
      }
    }
    return {
      id: calendarId,
      title: calendarId,
      style: {
        bgColor: schedules?.[0]?.bgColor || '#fff',
        borderColor: schedules?.[0]?.borderColor || '#fff',
        color: schedules?.[0]?.color || '#000',
      },
      events: schedules.filter(schedule => schedule.category !== 'milestone').map(convertScheduleToGanttEvent),
      milestones: schedules.filter(schedule => schedule.category === 'milestone').map(convertScheduleToGanttEvent),
    }
  }).filter(function<T>(item: T | null): item is T {return Boolean(item)})

  return ganttData
})