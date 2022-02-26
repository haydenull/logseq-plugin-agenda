import { useEffect, useRef, useState } from 'react'
import Calendar, { ISchedule } from 'tui-calendar'
import { Button, Select } from 'antd'
import { LeftOutlined, RightOutlined, SettingOutlined } from '@ant-design/icons'
import day from 'dayjs'
import { getSchedules, SHOW_DATE_FORMAT, CALENDAR_VIEWS, ISettingsForm, CALENDAR_THEME } from './util'
import Settings from './components/Settings'
import Weekly from './components/Weekly'
import 'tui-calendar/dist/tui-calendar.css'
import 'antd/dist/antd.css'
import './App.css'

const getDefaultOptions = () => ({
  defaultView: logseq.settings?.defaultView || 'week',
  taskView: true,
  scheduleView: true,
  useDetailPopup: true,
  isReadOnly: true,
  theme: CALENDAR_THEME,
  week: {
    startDayOfWeek: logseq.settings?.weekStartDay || 0,
    // narrowWeekend: true,
  },
  month: {
    startDayOfWeek: logseq.settings?.weekStartDay || 0,
    scheduleFilter: (schedule: ISchedule) => {
      console.log('[faiz:] === scheduleFilter', schedule)
      return Boolean(schedule.isVisible)
    },
  },
  template: {
    taskTitle: () => '<span class="tui-full-calendar-left-content">Overdue</span>',
    task: (schedule: ISchedule) => '🔥' + schedule.title,
    popupDetailBody: (schedule: ISchedule) => {
      return schedule.body?.split('\n').join('<br/>') + '<br/><a id="faiz-nav-detail" href="javascript:void(0);">Navigate To Block</a>'
    },
  },
})


const App: React.FC<{ env: string }> = ({ env }) => {

  const DEFAULT_OPTIONS = getDefaultOptions()

  const [currentView, setCurrentView] = useState(DEFAULT_OPTIONS.defaultView)
  const [showDate, setShowDate] = useState<string>()
  const [showExportWeekly, setShowExportWeekly] = useState<boolean>(true)
  const [weeklyModal, setWeeklyModal] = useState<{
    visible: boolean
    start?: string
    end?: string
  }>({ visible: false })
  const [settingModal, setSettingModal] = useState(false)
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
    setWeeklyModal({
      visible: true,
      start,
      end,
    })
  }

  const onViewChange = (value: string) => {
    setCurrentView(value)
    console.log('[faiz:] === onViewChange',value, calendarRef.current)
    if (value === '2week') {
      calendarRef.current?.changeView('month')
      calendarRef.current?.setOptions({
        month: {
          visibleWeeksCount: 2,
        },
      })
    } else if(value === 'month') {
      calendarRef.current?.changeView('month')
      calendarRef.current?.setOptions({
        month: {
          visibleWeeksCount: 6,
        },
      })
    } else {
      calendarRef.current?.changeView(value)
    }
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
  const onSettingChange = (values: ISettingsForm) => {
    console.log('[faiz:] === values', values)
    logseq.updateSettings(values)
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
    // if (values.logKey !== logseq.settings?.logKey) setSchedules()

    // exec after 500ms to make sure the settings are updated
    setTimeout(() => setSchedules(), 500)
    setSettingModal(false)
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
      document.querySelector('#faiz-nav-detail')?.addEventListener('click', async (e) => {
        const rawData = info.schedule.raw || {}
        const { id: pageId, originalName } = rawData?.page
        let pageName = originalName
        let blockUuid = rawData?.uuid
        // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
        if (!pageName) {
          const page = await logseq.Editor.getPage(pageId)
          pageName = page?.originalName
          const block = await logseq.Editor.getBlock(rawData.id)
          blockUuid = block?.uuid
        }
        logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
        logseq.hideMainUI()
      }, { once: true })
    })
  }, [])

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="w-screen h-screen fixed top-0 left-0 bg-black bg-opacity-50" onClick={() => logseq.hideMainUI()}></div>
      <div className="w-5/6 flex flex-col overflow-hidden bg-white relative rounded text-black p-3">
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
        <div id="calendar" style={{ maxHeight: '606px' }}></div>
        <Weekly
          visible={weeklyModal.visible}
          start={weeklyModal.start}
          end={weeklyModal.end}
          onCancel={() => setWeeklyModal({ visible: false })}
        />
        <Settings
          visible={settingModal}
          onCancel={() => setSettingModal(false)}
          onOk={onSettingChange}
        />
      </div>
    </div>
  )
}

export default App
