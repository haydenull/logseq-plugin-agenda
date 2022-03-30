import dayjs from 'dayjs'
import React, { useState } from 'react'
import { IEvent, IMode } from '../type'
import { scrollToDate } from '../util'

const Group: React.FC<{
  groupId?: string
  groupName: string
  events: IEvent[]
  milestones?: IEvent[]
  levelCount?: number
  mode: IMode
}> = ({ groupName, events, milestones, mode, levelCount = 0 }) => {
  return (
    <div className="group">
      <div className="group__title">{groupName}</div>
      <div className="group__content">
        {
          mode === 'simple'
          ? new Array(levelCount).fill(0).map((_, index) => (
            <div className="group__event cursor-pointer">Some Events</div>
          ))
          : events.map((event, index) => (
            <div className="group__event cursor-pointer" onClick={() => scrollToDate(dayjs(event.start))}>{event?.title}</div>
          ))
        }
        {
          mode === 'simple'
          ? milestones?.length && <div className="group__event cursor-pointer" onClick={() => scrollToDate(dayjs(milestones?.[0].start))}>Milestones</div>
          : milestones?.map((milestone, index) => (
            <div className="group__event cursor-pointer" onClick={() => scrollToDate(dayjs(milestone.start))}>{milestone?.title}</div>
          ))
        }
      </div>
    </div>
  )
}

export default Group
