import { useEffect, useState } from 'react'
import classNames from 'classnames'
import CalendarCom from '@/components/Calendar'
import { getDailyLogSchedules } from '@/util/schedule'
import { Tabs } from 'antd'
import Day from './components/Day'
import s from './index.module.less'

const index = () => {
  const [dailyLogSchedules, setDailyLogSchedules] = useState<any[]>([])

  useEffect(() => {
    getDailyLogSchedules()
      .then(res => {
        console.log('[faiz:] === res', res)
        setDailyLogSchedules(res)
      })
  }, [])

  return (
    <div className={classNames('page-container flex', s.page)}>
      <div className={classNames('flex flex-1 flex-col overflow-hidden p-8')}>

        <h1 className="title-text">Daily Log</h1>
        <div className="rounded-2xl flex w-full h-full p-6 bg-quaternary">
          <Tabs className="w-full" tabPosition="left">
            <Tabs.TabPane tab="Calendar" key="calendar">
              <CalendarCom schedules={dailyLogSchedules} isProjectCalendar={false} isDailyLogCalendar />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Day" key="day">
              <Day schedules={dailyLogSchedules} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Week" key="week">
              <Day schedules={dailyLogSchedules} type="week" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Month" key="month">
              <Day schedules={dailyLogSchedules} type="month" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Quarter" key="quarter">
              <Day schedules={dailyLogSchedules} type="quarter" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Year" key="year">
              <Day schedules={dailyLogSchedules} type="year" />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default index
