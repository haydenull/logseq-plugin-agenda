import { useEffect, useRef, useState } from 'react'
import Calendar from 'tui-calendar'
import { Button, Select } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import 'tui-calendar/dist/tui-calendar.css'
import 'antd/dist/antd.css'
import './App.css'

const DEFAULT_OPTIONS = {
  defaultView: 'month',
  task: true,
}

const App: React.FC<{ env: string }> = ({ env }) => {

  const [showDate, setShowDate] = useState()
  const calendarRef = useRef<Calendar>()

  const onViewChange = (value: string) => {
    console.log('[faiz:] === onViewChange',value, calendarRef.current)
    calendarRef.current?.changeView(value)
  }
  const onClickToday = () => {
    calendarRef.current?.today()
  }

  useEffect(() => {
    calendarRef.current = new Calendar('#calendar', {
      ...DEFAULT_OPTIONS,
      // template: {
      //   // monthDayname: function(dayname) {
      //   //   return '<span class="calendar-week-dayname-name">' + dayname.label + '</span>';
      //   // }
      // }
    })
  }, [])

  return (
    <div className="w-screen h-screen flex items-center justify-center text-white">
      <div className="w-screen h-screen fixed top-0 left-0" onClick={() => logseq.hideMainUI()}></div>
      <div className="w-5/6 h-5/6 bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 flex flex-col overflow-hidden">
        <div className="p-1">
          <Select defaultValue={DEFAULT_OPTIONS.defaultView} onChange={onViewChange} style={{ width: '150px' }}>
            <Select.Option value="day">Daily</Select.Option>
            <Select.Option value="week">weekly</Select.Option>
            <Select.Option value="month">monthly</Select.Option>
          </Select>

          <Button shape="round" onClick={onClickToday}>Today</Button>

          <Button shape="circle" icon={<LeftOutlined />}></Button>
          <Button shape="circle" icon={<RightOutlined />}></Button>

          <div>{{ showDate }}</div>
        </div>
        <div id="calendar"></div>
      </div>
    </div>
  )
}

export default App
