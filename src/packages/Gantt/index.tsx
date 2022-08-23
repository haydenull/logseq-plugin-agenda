import { Button, Select } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import React, { useEffect, useRef, useState } from 'react'
import Calendar from './components/Calendar'
import Group from './components/Group'
import { MODES, VIEWS } from './constants'
import './index.css'
import { IGroup, IMode, IView } from './type'
import { scrollToDate, transformDataToAdvancedMode, transformDataToSimpleMode } from './util'

const Gantt: React.FC<{
  weekStartDay: number
  data: IGroup[]
  showSidebar?: boolean
  showOptions?: boolean
  showModeSelector?: boolean
  defaultView?: IView
  defaultMode?: IMode
  theme?: 'light' | 'dark' | string
  uniqueId?: string
  [prop: string]: any
}> = ({ weekStartDay, data, showSidebar = true, showOptions = true, defaultView = 'day', defaultMode = 'simple', showModeSelector = false, theme = 'light', uniqueId = '', ...props }) => {
  const calendarRef = useRef<{ scrollToToday: () => void }>()
  const [view, setView] = useState<IView>(defaultView)
  const [mode, setMode] = useState<IMode>(defaultMode)
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

  const [ganttData, setGanttData] = useState<IGroup[]>([])
  const [foldedGroups, setFoldedGroups] = useState<string[]>([])

  const onFoldChange = (groupId: string, folded: boolean) => {
    if (folded) {
      setFoldedGroups([...foldedGroups, groupId])
    } else {
      setFoldedGroups(foldedGroups.filter(id => id !== groupId))
    }
  }

  useEffect(() => {
    const _data = mode === 'simple' ? transformDataToSimpleMode(data) : transformDataToAdvancedMode(data)
    setGanttData(_data)
  }, [data, mode])

  return (
    <div className={classNames(`w-full h-full relative gantt text view-${view}`, { dark: theme === 'dark' }, { light: theme !== 'dark' })} {...props}>
      {
        showSidebar && (
          <div className="calendar__placeholder absolute bg-quaternary"></div>
        )
      }
      {
        showOptions && (
          <div className="operation absolute right-0 top-0 z-30 bg-quaternary">
            <Button size="small" shape="round" onClick={() => scrollToDate(dayjs(), uniqueId)}>Today</Button>
            <Select size="small" options={VIEWS} defaultValue={view} onChange={(e: IView) => setView(e)} style={{ minWidth: '80px' }} className="ml-2 select-style" />
            {showModeSelector && (
              <Select size="small" options={MODES} defaultValue="simple" onChange={(e: IMode) => setMode(e)} style={{ minWidth: '110px' }} className="ml-2 select-style" />
            )}
          </div>
        )
      }
      <div className="flex h-full overflow-auto relative scroll-style">
        {
          showSidebar && (
            <div className="side-bar bg-quaternary sticky left-0 z-10 h-fit">
              {
                ganttData.map((group, index) => (
                  <Group
                    key={group.id}
                    mode={mode}
                    groupId={group.id}
                    groupName={group.title}
                    events={group?.events}
                    milestones={group?.milestones}
                    levelCount={group.levelCount}
                    uniqueId={uniqueId}
                    foldedGroups={foldedGroups}
                    onFoldChange={onFoldChange}
                  />
                ))
              }
            </div>
          )
        }
        <Calendar data={ganttData} ref={calendarRef} mode={mode} view={view} uniqueId={uniqueId} foldedGroups={foldedGroups} />
      </div>
    </div>
  )
}

export default Gantt
