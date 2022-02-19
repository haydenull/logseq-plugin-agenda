import { useEffect, useRef, useState } from 'react'
import Calendar from 'tui-calendar'
import { Button, Select } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import day from 'dayjs'
import 'tui-calendar/dist/tui-calendar.css'
import 'antd/dist/antd.css'
import './App.css'
import { getSchedules } from './util'

var templates = {
  popupIsAllDay: function() {
    return 'All Day';
  },
  popupStateFree: function() {
    return 'Free';
  },
  popupStateBusy: function() {
    return 'Busy';
  },
  titlePlaceholder: function() {
    return 'Subject';
  },
  locationPlaceholder: function() {
    return 'Location';
  },
  startDatePlaceholder: function() {
    return 'Start date';
  },
  endDatePlaceholder: function() {
    return 'End date';
  },
  popupSave: function() {
    return 'Save';
  },
  popupUpdate: function() {
    return 'Update';
  },
  popupDetailDate: function(isAllDay, start, end) {
    var isSameDate = day(start).isSame(end);
    var endFormat = (isSameDate ? '' : 'YYYY.MM.DD ') + 'hh:mm a';

    if (isAllDay) {
      return day(start).format('YYYY.MM.DD') + (isSameDate ? '' : ' - ' + day(end).format('YYYY.MM.DD'));
    }

    return (day(start).format('YYYY.MM.DD hh:mm a') + ' - ' + day(end).format(endFormat));
  },
  popupDetailLocation: function(schedule) {
    return 'Location : ' + schedule.location;
  },
  popupDetailUser: function(schedule) {
    return 'User : ' + (schedule.attendees || []).join(', ');
  },
  popupDetailState: function(schedule) {
    return 'State : ' + schedule.state || 'Busy';
  },
  popupDetailRepeat: function(schedule) {
    return 'Repeat : ' + schedule.recurrenceRule;
  },
  popupDetailBody: function(schedule) {
    return 'Body : ' + schedule.body;
  },
  popupEdit: function() {
    return 'Edit';
  },
  popupDelete: function() {
    return 'Delete';
  }
};

const DEFAULT_OPTIONS = {
  defaultView: 'month',
  taskView: true,
  scheduleView: true,
  // template: templates,
  useDetailPopup: true,
  isReadOnly: true,
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
  const setSchedules = async () => {
    const calendar = calendarRef.current
    if (calendar) {
      calendar.clear()

      const schedules = await getSchedules() || []
      calendar.createSchedules(schedules?.map(block => {
        const date = block?.page?.journalDay
        const time = block.content?.substr(0, 5)
        const hasTime = time.split(':')?.filter(num => !Number.isNaN(Number(num)))?.length === 2
        return {
          id: block.id,
          calendarId: 'journal',
          title: block.content,
          category: hasTime ? 'time' : 'allday',
          dueDateClass: '',
          start: hasTime ? day(date + ' ' + time, 'YYYYMMDD HH:mm').format() : day(String(date), 'YYYYMMDD').format(),
          // end: hasTime ? day(date + ' ' + time, 'YYYYMMDD HH:mm').add(1, 'hour').format() : day(date, 'YYYYMMDD').add(1, 'day').format(),
          isAllDay: !hasTime,
        }
      }))

      calendar.render()

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
    setSchedules()
  }, [])

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="w-screen h-screen fixed top-0 left-0 bg-black bg-opacity-50" onClick={() => logseq.hideMainUI()}></div>
      <div className="w-5/6 h-5/6 flex flex-col overflow-hidden bg-white relative rounded text-black p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <Select defaultValue={DEFAULT_OPTIONS.defaultView} onChange={onViewChange} style={{ width: '150px' }}>
              <Select.Option value="day">Daily</Select.Option>
              <Select.Option value="week">Weekly</Select.Option>
              <Select.Option value="month">Monthly</Select.Option>
            </Select>

            <Button className="ml-4" shape="round" onClick={onClickToday}>Today</Button>

            <Button className="ml-4" shape="circle" icon={<LeftOutlined />} onClick={onClickPrev}></Button>
            <Button className="ml-1" shape="circle" icon={<RightOutlined />} onClick={onClickNext}></Button>

            <span className="ml-4 text-xl">{ showDate }</span>
          </div>

          <Button onClick={setSchedules} type="primary">Sync</Button>
        </div>
        <div id="calendar"></div>
      </div>
    </div>
  )
}

export default App
