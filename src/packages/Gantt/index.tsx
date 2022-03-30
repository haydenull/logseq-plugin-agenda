import React, { useState } from 'react'
import Calendar from './components/Calendar'
import Group from './components/Group'
import './index.css'
import { IGroup } from './type'

const Gantt: React.FC<{
  [prop: string]: any
}> = ({ ...props }) => {
  const [data, setData] = useState<IGroup[]>([
    {
      id: '1',
      title: 'Group 1',
      events: [
        {
          id: '1',
          title: 'Event 1',
          start: '2022-03-30',
          end: '2020-03-31',
          raw: {},
        },
        {
          id: '2',
          title: 'Event 2',
          start: '2022-04-02',
          end: '2020-04-02',
          raw: {},
        },
        {
          id: '3',
          title: 'Event 3',
          start: '2022-04-06',
          end: '2020-04-08',
          raw: {},
        },
      ],
      milestones: [
        {
          id: '11',
          title: 'Milestone 1',
          start: '2020-04-06',
          end: '2020-04-06',
          raw: {},
        },
      ],
    },
    {
      id: '2-1',
      title: 'Group 2',
      events: [
        {
          id: '2-1',
          title: 'Event 2-1',
          start: '2022-03-30',
          end: '2020-03-31',
          raw: {},
        },
        {
          id: '2-2',
          title: 'Event 2-2',
          start: '2022-04-02',
          end: '2020-04-02',
          raw: {},
        },
        {
          id: '2-3',
          title: 'Event 2-3',
          start: '2022-04-06',
          end: '2020-04-08',
          raw: {},
        },
      ],
      milestones: [
        {
          id: '2-11',
          title: 'Milestone 2-1',
          start: '2020-04-06',
          end: '2020-04-06',
          raw: {},
        },
      ],
    },
  ])

  return (
    <div className="w-full h-full overflow-auto flex" style={{ maxHeight: '300px' }}>
      <div className="side-bar">
        {
          data.map((group, index) => (
            <Group key={group.id} groupName={group.title} events={group?.events?.concat(group?.milestones || [])} />
          ))
        }
      </div>
      <Calendar data={data} />
    </div>
  )
}

export default Gantt
