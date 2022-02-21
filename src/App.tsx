import { useEffect, useRef, useState } from 'react'
import Calendar from 'tui-calendar'
import { Button, Select, Modal, Input, Typography, Form } from 'antd'
import { LeftOutlined, RightOutlined, SettingOutlined } from '@ant-design/icons'
import day from 'dayjs'
import 'tui-calendar/dist/tui-calendar.css'
import 'antd/dist/antd.css'
import './App.css'
import { getSchedules, getWeekly, SHOW_DATE_FORMAT } from './util'

const DEFAULT_OPTIONS = {
  defaultView: 'week',
  taskView: true,
  scheduleView: true,
  useDetailPopup: true,
  isReadOnly: true,
  week: {
    startDayOfWeek: 1,
    narrowWeekend: true,
  },
  month: {
    startDayOfWeek: 1,
  },
}

const App: React.FC<{ env: string }> = ({ env }) => {

  const [showDate, setShowDate] = useState<string>()
  const [showExportWeekly, setShowExportWeekly] = useState<boolean>(true)
  const [weeklyModal, setWeeklyModal] = useState({
    visible: false,
    content: '',
  })
  const [settingModal, setSettingModal] = useState({
    visible: false,
  })
  const calendarRef = useRef<Calendar>()

  const changeShowDate = () => {
    if (calendarRef.current) {
      const dateRangeStart = day(calendarRef.current.getDateRangeStart().getTime())
      const dateRangeEnd = day(calendarRef.current.getDateRangeEnd().getTime())
      if (dateRangeStart.isSame(dateRangeEnd, 'day')) {
        setShowDate(dateRangeStart.format(SHOW_DATE_FORMAT))
      } else {
        setShowDate(dateRangeStart.format(SHOW_DATE_FORMAT) + ' ~ ' + dateRangeEnd.format(SHOW_DATE_FORMAT))
      }
    }
  }
  const setSchedules = async () => {
    const calendar = calendarRef.current
    if (calendar) {
      calendar.clear()

      const schedules = await getSchedules()
      calendar.createSchedules(schedules)

      calendar.render()

    }
  }
  const exportWeekly = async () => {
    const [start, end] = showDate?.split(' ~ ') || []
    const logs = await getWeekly(start, end) || []
    setWeeklyModal({
      visible: true,
      content: logs.map(log => log.content).join('\n\n'),
    })
  }

  const onViewChange = (value: string) => {
    console.log('[faiz:] === onViewChange',value, calendarRef.current)
    calendarRef.current?.changeView(value)
    changeShowDate()
    setShowExportWeekly(value === 'week')
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

          <div>
            { showExportWeekly && <Button className="mr-4" onClick={exportWeekly}>Export Weekly</Button> }
            <Button className="mr-4" onClick={setSchedules} type="primary">Sync</Button>
            <Button onClick={() => setSettingModal({ visible: true })} shape="circle" icon={<SettingOutlined />}></Button>
          </div>
        </div>
        <div id="calendar"></div>
        <Modal
          title="Weekly Logs"
          visible={weeklyModal.visible}
          onCancel={() => setWeeklyModal({ visible: false, content: '' })}
          onOk={() => setWeeklyModal({ visible: false, content: '' })}
        >
          <Input.TextArea value={weeklyModal.content} rows={10} />
        </Modal>
        <Modal
          title="Calendar Setting"
          visible={settingModal.visible}
          onCancel={() => setSettingModal({ visible: false })}
        >
          <Form>
            <Form.Item label="Default View">
              <Select defaultValue={DEFAULT_OPTIONS.defaultView} onChange={onViewChange} style={{ width: '150px' }}>
                <Select.Option value="day">Daily</Select.Option>
                <Select.Option value="week">Weekly</Select.Option>
                <Select.Option value="month">Monthly</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Week Start Day">
              <Select defaultValue={DEFAULT_OPTIONS.week.startDayOfWeek} onChange={(value) => {
                DEFAULT_OPTIONS.week.startDayOfWeek = value as number
                calendarRef.current?.setOptions(DEFAULT_OPTIONS)
              }} style={{ width: '150px' }}>
                <Select.Option value={0}>Sunday</Select.Option>
                <Select.Option value={1}>Monday</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Journal Date Format">
              <Input />
            </Form.Item>
            <Form.Item label="Log Key">
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default App
