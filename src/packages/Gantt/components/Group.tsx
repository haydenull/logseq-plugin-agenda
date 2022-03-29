import React, { useState } from 'react'
import { IEvent } from '../type'

const Group: React.FC<{
  groupId?: string
  groupName: string
  events: IEvent[]
}> = ({ groupName, events }) => {
  return (
    <div className="group">
      <div className="group__title">{groupName}</div>
      <div className="group__content">
        {
          events.map((event, index) => (
            <div className="group__event">{event?.title}</div>
          ))
        }
      </div>
    </div>
  )
}

export default Group
