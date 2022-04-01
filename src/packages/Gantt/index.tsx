import { Button, Select } from 'antd'
import dayjs from 'dayjs'
import React, { useRef, useState } from 'react'
import Calendar from './components/Calendar'
import Group from './components/Group'
import { MODES, VIEWS } from './constants'
import './index.css'
import { IGroup, IMode, IView } from './type'
import { scrollToDate, transformDataToAdvancedMode, transformDataToSimpleMode } from './util'

const Gantt: React.FC<{
  weekStartDay: number
  data: IGroup[]
  [prop: string]: any
}> = ({ weekStartDay, data, ...props }) => {
  const calendarRef = useRef<{ scrollToToday: () => void }>()
  const [view, setView] = useState<IView>('day')
  const [mode, setMode] = useState<IMode>('simple')
  // const [data, setData] = useState<IGroup[]>([
  //   {
  //     id: '1',
  //     title: 'Group 1',
  //     events: [
  //       {
  //         id: '1',
  //         title: 'Event 1',
  //         start: '2022-03-30',
  //         end: '2022-03-31',
  //         raw: {},
  //       },
  //       {
  //         id: '2',
  //         title: 'Event 2',
  //         start: '2022-03-31',
  //         end: '2022-04-02',
  //         raw: {},
  //       },
  //       {
  //         id: '3',
  //         title: 'Event 3',
  //         start: '2022-04-06',
  //         end: '2022-04-08',
  //         raw: {},
  //       },
  //     ],
  //     milestones: [
  //       {
  //         id: '11',
  //         title: 'Milestone 1',
  //         start: '2022-04-06',
  //         end: '2022-04-06',
  //         raw: {},
  //       },
  //       {
  //         id: '12',
  //         title: 'Milestone 2',
  //         start: '2022-04-09',
  //         end: '2022-04-09',
  //         raw: {},
  //       },
  //     ],
  //   },
  //   {
  //     id: '2-1',
  //     title: 'Group 2',
  //     events: [
  //       {
  //         id: '2-1',
  //         title: 'Event 2-1',
  //         start: '2022-03-30',
  //         end: '2022-03-31',
  //         raw: {},
  //       },
  //       {
  //         id: '2-2',
  //         title: 'Event 2-2',
  //         start: '2022-04-02',
  //         end: '2022-04-02',
  //         raw: {},
  //       },
  //       {
  //         id: '2-3',
  //         title: 'Event 2-3',
  //         start: '2022-04-06',
  //         end: '2022-04-08',
  //         raw: {},
  //       },
  //     ],
  //     milestones: [
  //       {
  //         id: '2-11',
  //         title: 'Milestone 2-1',
  //         start: '2022-04-06',
  //         end: '2022-04-06',
  //         raw: {},
  //       },
  //       {
  //         id: '2-12',
  //         title: 'Milestone 2-12',
  //         start: '2022-04-08',
  //         end: '2022-04-08',
  //         raw: {},
  //       },
  //     ],
  //   },
  // ])

  const _data = mode === 'simple' ? transformDataToSimpleMode(data) : transformDataToAdvancedMode(data)

  return (
    <div className={`w-full h-full relative view-${view}`} {...props}>
      <div className="calendar__placeholder absolute bg-white"></div>
      <div className="operation absolute right-0 top-0 z-30 bg-white">
        <Button size="small" shape="round" onClick={() => scrollToDate(dayjs())}>Today</Button>
        <Select size="small" options={VIEWS} defaultValue={view} onChange={(e: IView) => setView(e)} style={{ minWidth: '80px' }} className="ml-2" />
        <Select size="small" options={MODES} defaultValue="simple" onChange={(e: IMode) => setMode(e)} style={{ minWidth: '110px' }} className="ml-2" />
      </div>
      <div className="flex h-full overflow-auto relative">
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
        <Calendar data={_data} ref={calendarRef} mode={mode} view={view} />
      </div>
    </div>
  )
}

export default Gantt
