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
      <Calendar data={ganttData} ref={calendarRef} mode={mode} view={view} uniqueId={uniqueId} foldedGroups={foldedGroups} showSidebar={showSidebar} onFoldChange={onFoldChange} />
    </div>
  )
}

export default Gantt
