import { Button, Select } from 'antd'
import dayjs from 'dayjs'
import React, { useRef, useState } from 'react'
import Calendar from './components/Calendar'
import Group from './components/Group'
import { MODES } from './constants'
import './index.css'
import { IGroup, IMode } from './type'
import { scrollToDate, transformDataToSimpleMode } from './util'

const Gantt: React.FC<{
  [prop: string]: any
}> = ({ ...props }) => {
  const calendarRef = useRef<{ scrollToToday: () => void }>()
  const [mode, setMode] = useState<IMode>('simple')
  const [data, setData] = useState<IGroup[]>([
    {
      id: '1',
      title: 'Group 1',
      events: [
        {
          id: '1',
          title: 'Event 1',
          start: '2022-03-30',
          end: '2022-03-31',
          raw: {},
        },
        {
          id: '2',
          title: 'Event 2',
          start: '2022-03-31',
          end: '2022-04-02',
          raw: {},
        },
        {
          id: '3',
          title: 'Event 3',
          start: '2022-04-06',
          end: '2022-04-08',
          raw: {},
        },
      ],
      milestones: [
        {
          id: '11',
          title: 'Milestone 1',
          start: '2022-04-06',
          end: '2022-04-06',
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
          end: '2022-03-31',
          raw: {},
        },
        {
          id: '2-2',
          title: 'Event 2-2',
          start: '2022-04-02',
          end: '2022-04-02',
          raw: {},
        },
        {
          id: '2-3',
          title: 'Event 2-3',
          start: '2022-04-06',
          end: '2022-04-08',
          raw: {},
        },
      ],
      milestones: [
        {
          id: '2-11',
          title: 'Milestone 2-1',
          start: '2022-04-06',
          end: '2022-04-06',
          raw: {},
        },
      ],
    },
  ])

  const _data = mode === 'simple' ? transformDataToSimpleMode(data) : data
  console.log('[faiz:] === _data', _data)

  return (
    <div className="w-full h-full relative">
      <div className="operation absolute right-0 top-0 z-30">
        <Button size="small" shape="round" onClick={() => scrollToDate(dayjs())}>Today</Button>
        <Select size="small" options={MODES} defaultValue="simple" onChange={(e: IMode) => setMode(e)} style={{ minWidth: '110px' }} className="ml-2" />
      </div>
      <div className="flex overflow-auto relative" style={{ maxHeight: '400px' }}>
        <div className="side-bar bg-white sticky left-0 z-10 h-fit">
          {
            _data.map((group, index) => (
              <Group
                key={group.id}
                mode={mode}
                groupName={group.title}
                events={group?.events}
                milestones={group?.milestones}
                levelCount={group.levelCount}
              />
            ))
          }
        </div>
        <Calendar data={_data} ref={calendarRef} mode={mode} />
      </div>
    </div>
  )
}

export default Gantt
