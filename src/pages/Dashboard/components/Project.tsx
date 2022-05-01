import React, { useState } from 'react'
import { IGroup } from '@/packages/Gantt/type'
import { IoIosArrowUp, IoIosArrowDown} from 'react-icons/io'

import s from '../index.module.less'
import classNames from 'classnames'
import dayjs from 'dayjs'
import Gantt from '@/packages/Gantt'

function getNearestMilestone(data: IGroup) {
  const { milestones = [] } = data
  if (milestones?.length === 0) return null
  const futureMilestones = milestones.filter(item => dayjs(item.start).isSameOrAfter(dayjs(), 'day'))
  if (futureMilestones.length === 0) return null
  return futureMilestones.sort((a, b) => {
    return dayjs(a.start).diff(dayjs(b.start))
  })?.[0]

}

const Project: React.FC<{
  data: IGroup
}> = ({ data }) => {
  const [expand, setExpand] = useState(false)

  const milestone = getNearestMilestone(data)

  return (
    <div className={classNames(s.project)}>
      <div className={classNames('flex flex-col flex-1 w-0', s.projectContent, { [s.expand]: expand })}>
        <div className="flex justify-between items-center h-24 p-3">
          <div className="h-full flex items-center">
            <div
              className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-lg font-medium"
              style={{backgroundColor: data?.style?.bgColor, color: data?.style?.color}}
            >{data.title?.[0]?.toUpperCase()}</div>
            <div className="ml-3">
              <div className="text-lg title-text">{data.title}</div>
              <div className="mt-1 description-text">
                todo: 10 doing: 5 done: 5
              </div>
            </div>
          </div>

          <div className="h-full">
            {
              milestone && (
                <div className={classNames('flex flex-col items-center justify-center d h-full pl-3 pr-1', s.milestone)}>
                  <div className="text-center">
                    <span className="text-3xl title-text">{dayjs(milestone.start).format('DD')}</span>
                    <span className="text-xs description-text ml-1">{dayjs(milestone.start).format('MMM')}</span>
                  </div>
                  <span className="text-xs description-text">days left: {dayjs(milestone.start).diff(dayjs(), 'day')}d</span>
                  <span className="text-xs description-text" title={milestone.title}>{milestone.title}</span>
                </div>
              )
            }
          </div>

        </div>

        <div className={classNames(s.timeline, { [s.showTimeline]: expand })}>
          { expand && (
            <Gantt data={[data]} weekStartDay={0} showOptions={false} showSidebar={false} defaultView="week" />
          ) }
        </div>
      </div>
      <div
        className={classNames(s.option, 'text w-11 h-11 rounded-full flex justify-center items-center shadow-sm text-lg ml-3 cursor-pointer')}
        onClick={() => setExpand(!expand)}
      >
        <span className="text-xs">100%</span>
        <div className="flex items-center">{ expand ? <IoIosArrowUp /> : <IoIosArrowDown /> }</div>
      </div>
    </div>
  )
}

export default Project
