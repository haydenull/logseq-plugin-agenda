import { useEffect, useRef, useState } from 'react'
import Calendar, { ISchedule } from 'tui-calendar'
import { Button, Select, Modal, Input, Form, message } from 'antd'
import { LeftOutlined, RightOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import day from 'dayjs'
import 'tui-calendar/dist/tui-calendar.css'
import 'antd/dist/antd.css'
import './App.css'
import { getSchedules, getWeekly, SHOW_DATE_FORMAT, CALENDAR_VIEWS } from './util'
import { useForm } from 'antd/lib/form/Form'

type ISettingForm = Partial<{
  defaultView: string
  weekStartDay: 0 | 1
  journalDateFormatter: string
  logKey: string
}>

const getInitalSettingForm = (): ISettingForm => ({
  defaultView: logseq.settings?.defaultView || 'week',
  weekStartDay: logseq.settings?.weekStartDay || 0,
  journalDateFormatter: logseq.settings?.journalDateFormatter || 'YYYY-MM-DD ddd',
  logKey: logseq.settings?.logKey || 'Daily Log',
})

const getDefaultOptions = () => ({
  defaultView: logseq.settings?.defaultView || 'week',
  taskView: true,
  scheduleView: true,
  useDetailPopup: true,
  isReadOnly: true,
  week: {
    startDayOfWeek: logseq.settings?.weekStartDay || 0,
    narrowWeekend: true,
  },
  month: {
    startDayOfWeek: logseq.settings?.weekStartDay || 0,
    scheduleFilter: (schedule: ISchedule) => {
      console.log('[faiz:] === scheduleFilter', schedule)
      return Boolean(schedule.isVisible)
    },
  },
  template: {
    popupDetailBody: (schedule: ISchedule) => {
      // const { detail } = schedule
      // function nav() {
      //   logseq.App.pushState('page', { name: detail })
      // }
      return `<a id="faiz-nav-detail" href="javascript:void(0);" data-block-id="${schedule.body}">Navigate To Block</a>`
    },
  },
})


const App: React.FC<{ env: string }> = ({ env }) => {

  const DEFAULT_OPTIONS = getDefaultOptions()

  const [currentView, setCurrentView] = useState(DEFAULT_OPTIONS.defaultView)
  const [showDate, setShowDate] = useState<string>()
  const [showExportWeekly, setShowExportWeekly] = useState<boolean>(true)
  const [weeklyModal, setWeeklyModal] = useState({
    visible: false,
    content: '',
  })
  const [settingModal, setSettingModal] = useState(false)
  const calendarRef = useRef<Calendar>()
  const [settingForm] = useForm<ISettingForm>()


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
      // calendar.createSchedules([{
      //   id: '1',
      //   calendarId: 'journal',
      //   title: 'Daily Log test',
      //   category: 'time',
      //   dueDateClass: '',
      //   start: day().format(),
      //   // isAllDay: true,
      //   body: 'Daily Log test detail\n123',
      // }, {
      //   id: '1',
      //   calendarId: 'journal',
      //   title: 'Daily Log foo',
      //   category: 'time',
      //   dueDateClass: '',
      //   start: day().format(),
      //   // isAllDay: true,
      //   body: 'Daily Log test detail\n123',
      // }])

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
    setCurrentView(value)
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
    // logseq.App.pushState('page', { uuid: '6212fe1a-0b30-4c2a-b688-b1a7db33c822' })
    // logseq.App.pushState('page', { name: '07:44 logseq-plugin-calendar' })
    // logseq.App.pushState('page', { id: 525 })
    calendarRef.current?.next()
    changeShowDate()
  }
  const onClickSettingSave = () => {
    settingForm.validateFields().then(values => {
      // const values = settingForm.getFieldsValue()
      console.log('[faiz:] === values', values)
      if (values.weekStartDay !== logseq.settings?.weekStartDay) {
        calendarRef.current?.setOptions({
          week: {
            startDayOfWeek: values.weekStartDay,
          },
          month: {
            startDayOfWeek: values.weekStartDay,
          },
        })
      }
      if (values.logKey !== logseq.settings?.logKey) setSchedules()
      logseq.updateSettings(values)
      setSettingModal(false)
    })
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
    calendarRef.current.on('clickDayname', function(event) {
      const calendar = calendarRef.current
      if (calendar?.getViewName() === 'week') {
        calendar.setDate(new Date(event.date))
        calendar.changeView('day', true)
        changeShowDate()
        setCurrentView('day')
      }
    })
    calendarRef.current.on('clickMore', function(event) {
      console.log('clickMore', event.date, event.target)
    })
    calendarRef.current.on('clickSchedule', function(info) {
      console.log('clickSchedule', info, document.querySelectorAll('.faiz-nav-detail'))
      document.querySelector('#faiz-nav-detail')?.addEventListener('click', (e) => {
        console.log('[faiz:] === click nav', e)
        const dataset = (e.target as any)?.dataset
        if (dataset.blockId) {
          logseq.App.pushState('page', { name: dataset.blockId })
          logseq.hideMainUI()
        } else {
          logseq.App.showMsg('error', 'blockId not found')
        }
      }, { once: true })
    })
  }, [])

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="w-screen h-screen fixed top-0 left-0 bg-black bg-opacity-50" onClick={() => logseq.hideMainUI()}></div>
      <div className="w-5/6 h-5/6 flex flex-col overflow-hidden bg-white relative rounded text-black p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <Select
              value={currentView}
              defaultValue={DEFAULT_OPTIONS.defaultView}
              onChange={onViewChange}
              options={CALENDAR_VIEWS}
              style={{ width: '100px' }}
            />

            <Button className="ml-4" shape="round" onClick={onClickToday}>Today</Button>

            <Button className="ml-4" shape="circle" icon={<LeftOutlined />} onClick={onClickPrev}></Button>
            <Button className="ml-1" shape="circle" icon={<RightOutlined />} onClick={onClickNext}></Button>

            <span className="ml-4 text-xl h-full items-center inline-block" style={{ height: '34px', lineHeight: '34px' }}>{ showDate }</span>
          </div>

          <div>
            { showExportWeekly && <Button className="mr-4" onClick={exportWeekly}>Export Weekly</Button> }
            <Button className="mr-4" onClick={setSchedules} type="primary">Sync</Button>
            <Button onClick={() => setSettingModal(true)} shape="circle" icon={<SettingOutlined />}></Button>
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
          destroyOnClose
          title="Calendar Setting"
          okText="Save"
          visible={settingModal}
          onCancel={() => setSettingModal(false)}
          onOk={onClickSettingSave}
        >
          <Form initialValues={getInitalSettingForm()} form={settingForm} labelCol={{ span: 10 }} preserve={false}>
            <Form.Item label="Default View" name="defaultView" rules={[{ required: true }]}>
              <Select options={CALENDAR_VIEWS} />
            </Form.Item>
            <Form.Item label="Week Start Day" name="weekStartDay" rules={[{ required: true }]}>
              <Select>
                <Select.Option value={0}>Sunday</Select.Option>
                <Select.Option value={1}>Monday</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Journal Date Formatter" required>
              <div className="flex items-center">
                <Form.Item name="journalDateFormatter" noStyle rules={[{ required: true }]} getValueFromEvent={(e) => e.target.value.trim()}><Input /></Form.Item>
                <QuestionCircleOutlined className="ml-1" onClick={() => logseq.App.openExternalLink('https://day.js.org/docs/en/display/format')} />
              </div>
            </Form.Item>
            <Form.Item label="Log Key" name="logKey" rules={[{ required: true }]} getValueFromEvent={(e) => e.target.value.trim()}>
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default App
