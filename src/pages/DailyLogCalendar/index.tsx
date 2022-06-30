import classNames from 'classnames'

import CalendarCom from '@/components/Calendar'
import s from './index.module.less'
import { useEffect, useState } from 'react'
import { getDailyLogSchedules } from '@/util/schedule'

const index = () => {
  const [dailyLogSchedules, setDailyLogSchedules] = useState<any[]>([])

  useEffect(() => {
    getDailyLogSchedules()
      .then(res => {
        setDailyLogSchedules(res)
      })
  }, [])

  return (
    <div className="page-container flex">
      <div className={classNames('flex flex-1 flex-col overflow-hidden p-8')}>

        <h1 className="title-text">Daily Log</h1>
        <div className="bg-quaternary flex flex-col flex-1 rounded-2xl box-border p-6">
          <CalendarCom schedules={dailyLogSchedules} isProjectCalendar={false} />
        </div>
      </div>
    </div>
  )
}

export default index
