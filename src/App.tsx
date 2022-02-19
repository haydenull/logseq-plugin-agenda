import { useEffect, useRef, useState } from 'react'
import Calendar from 'tui-calendar'
import { Button, Select } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import day from 'dayjs'
import 'tui-calendar/dist/tui-calendar.css'
import 'antd/dist/antd.css'
import './App.css'

const DEFAULT_OPTIONS = {
  defaultView: 'month',
  taskView: true,
  scheduleView: true,
}

const App: React.FC<{ env: string }> = ({ env }) => {

  const [showDate, setShowDate] = useState<string>()
  const calendarRef = useRef<Calendar>()

  const changeShowDate = () => {
    if (calendarRef.current) {
      const dateRangeStart = day(calendarRef.current.getDateRangeStart().getTime())
      const dateRangeEnd = day(calendarRef.current.getDateRangeEnd().getTime())
      if (dateRangeStart.isSame(dateRangeEnd, 'day')) {
        setShowDate(dateRangeStart.format('YYYY-MM-DD'))
      } else {
        setShowDate(dateRangeStart.format('YYYY-MM-DD') + ' ~ ' + dateRangeEnd.format('YYYY-MM-DD'))
      }
    }
  }

  const onViewChange = (value: string) => {
    console.log('[faiz:] === onViewChange',value, calendarRef.current)
    calendarRef.current?.changeView(value)
    changeShowDate()
  }
  const onClickToday = () => {
    calendarRef.current?.today()
    changeShowDate()
  }
  const onClickPrev = () => {
    calendarRef.current?.prev()
    changeShowDate()
  }
  const onClickNext = () => {
    calendarRef.current?.next()
    changeShowDate()
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
    changeShowDate()
  }, [])

  return (
    <div className="w-screen h-screen flex items-center justify-center text-white">
      <div className="w-screen h-screen fixed top-0 left-0" onClick={() => logseq.hideMainUI()}></div>
      <div className="w-5/6 h-5/6 flex flex-col overflow-hidden">
        <div className="mb-2 flex items-center">
          <Select defaultValue={DEFAULT_OPTIONS.defaultView} onChange={onViewChange} style={{ width: '150px' }}>
            <Select.Option value="day">Daily</Select.Option>
            <Select.Option value="week">Weekly</Select.Option>
            <Select.Option value="month">Monthly</Select.Option>
          </Select>

          <Button className="ml-4" shape="round" onClick={onClickToday}>Today</Button>

          <Button className="ml-4" shape="circle" icon={<LeftOutlined />} onClick={onClickPrev}></Button>
          <Button className="ml-1" shape="circle" icon={<RightOutlined />} onClick={onClickNext}></Button>

          <span className="ml-4 text-black text-xl">{ showDate }</span>
        </div>
        <div id="calendar"></div>
      </div>
    </div>
  )
}

export default App
