import React, { useState } from 'react'
import Gantt from '@/packages/Gantt'
import { getPageData } from '@/util/logseq'
import { IEvent, IGroup } from '@/packages/Gantt/type'
import { ISchedule } from 'tui-calendar'
import classNames from 'classnames'

import s from './index.module.less'

const index: React.FC<{}> = () => {
  // const ganttData: IGroup[] = showCalendarList.map(calendarId => {
  //   const schedules = scheduleCalendarMap.get(calendarId)
  //   if (!schedules) return null
  //   const convertScheduleToGanttEvent = (schedule: ISchedule): IEvent => {
  //     const { raw = {}, start, end, id = '', title = '' } = schedule
  //     // @ts-ignore
  //     const dayjsStart = dayjs(start)
  //     // @ts-ignore
  //     const dayjsEnd = dayjs(end)
  //     return {
  //       id,
  //       title,
  //       start: dayjsStart.format('YYYY-MM-DD'),
  //       end: end ? dayjsEnd.format('YYYY-MM-DD') : dayjsStart.format('YYYY-MM-DD'),
  //       raw: {
  //         blockData: raw,
  //         calendarSchedule: schedule,
  //       },
  //       detailPopup: (<div className="text-xs">
  //         <div className="font-bold text-base my-2">{title}</div>
  //         <div className="my-2">{`${dayjsStart.format('YYYY.MM.DD hh:mm a')} - ${dayjsEnd.format('hh:mm a')}`}</div>
  //         <p className="whitespace-pre-line">{raw.content}</p>

  //         <a onClick={async () => {
  //           const rawData: any = raw
  //           const { id: pageId, originalName } = rawData?.page || {}
  //           let pageName = originalName
  //           // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
  //           if (!pageName) {
  //             const page = await getPageData({ id: pageId })
  //             pageName = page?.originalName
  //           }
  //           const { uuid: blockUuid } = await logseq.Editor.getBlock(rawData.id) || { uuid: '' }
  //           logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
  //           logseq.hideMainUI()
  //         }}>Navigate to block</a>
  //       </div>)
  //     }
  //   }
  //   return {
  //     id: calendarId,
  //     title: calendarId,
  //     events: schedules.filter(schedule => schedule.category !== 'milestone').map(convertScheduleToGanttEvent),
  //     milestones: schedules.filter(schedule => schedule.category === 'milestone').map(convertScheduleToGanttEvent),
  //   }
  // }).filter(function<T>(item: T | null): item is T {return Boolean(item)})

  return (
    <div className="page-container p-8 flex flex-col">
      <h1>Gantt</h1>
      <div className={classNames(s.contentWrapper)}>
        <Gantt data={[]} weekStartDay={logseq.settings?.weekStartDay || 0} />
      </div>
    </div>
  )
}

export default index
