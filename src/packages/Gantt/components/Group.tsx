import dayjs from 'dayjs'
import React from 'react'
import { IEvent, IMode } from '../type'
import { scrollToDate } from '../util'

const Group: React.FC<{
  groupId?: string
  groupName: string
  events: IEvent[]
  milestones?: IEvent[]
  levelCount?: number
  mode: IMode
}> = ({ groupName, events, milestones = [], mode, levelCount = 0 }) => {
  return (
    <div className="group rounded-sm">
      <div className="group__title font-medium">{groupName}</div>
      <div className="group__content">
        {
          mode === 'simple'
          ? new Array(levelCount).fill(0).map((_, index) => (
            <div className="group__event cursor-pointer"></div>
          ))
          : events.map((event) => (
            <div className="group__event cursor-pointer" onClick={() => scrollToDate(dayjs(event.start))}>
              {event?.title}
            </div>
          ))
        }
        {
          mode === 'simple'
          ? milestones?.length && <div className="group__event cursor-pointer flex justify-between items-center">
            {/* Milestones */}
          </div>
          : milestones?.map((milestone, index) => (
            <div className="group__event cursor-pointer" onClick={() => scrollToDate(dayjs(milestone.start))}>
              {milestone?.title}
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default Group
