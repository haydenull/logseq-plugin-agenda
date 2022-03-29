import React, { useState } from 'react'
import Calendar from './components/Calendar'
import Group from './components/Group'
import './index.css'

const Gantt: React.FC<{
  [prop: string]: any
}> = ({ ...props }) => {
  const [data, setData] = useState([
    {
      groupId: '1',
      groupName: 'Group 1',
      events: [
        {
          id: '1',
          title: 'Event 1',
          start: '2020-01-01',
          end: '2020-01-02',
          raw: {},
        },
      ],
      milestones: [

      ],
    },
  ])

  return (
    <div className="w-full h-full overflow-auto flex">
      {/* <div style={{ height: '300px' }}></div> */}
      <div className="side-bar">
        <Group />
        {/* <Group />
        <Group />
        <Group /> */}
      </div>
      <Calendar />
    </div>
  )
}

export default Gantt
