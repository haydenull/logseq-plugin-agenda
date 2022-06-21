import classNames from 'classnames'
import { useAtom } from 'jotai'

import { subscriptionSchedulesAtom } from '@/model/schedule'
import CalendarCom from '@/components/Calendar'
import s from './index.module.less'
import { fullCalendarSchedulesAtom } from '@/model/events'
import { useEffect, useState } from 'react'
import { getCustomCalendarSchedules } from '@/util/schedule'

const index = () => {
  const [internalSchedules] = useAtom(fullCalendarSchedulesAtom)
  const [subscriptionSchedules] = useAtom(subscriptionSchedulesAtom)
  const [customCalendarSchedules, setCustomCalendarSchedules] = useState<any[]>([])

  useEffect(() => {
    getCustomCalendarSchedules()
      .then(res => {
        setCustomCalendarSchedules(res)
      })
  }, [])

  return (
    <div className="page-container flex">
      <div className={classNames(s.content, 'flex flex-1 flex-col overflow-hidden p-8')} style={{ maxWidth: '1800px' }}>

        <h1 className="title-text">Calendar</h1>
        <div className="bg-quaternary flex flex-col flex-1 rounded-2xl box-border p-6">
          <CalendarCom schedules={[...subscriptionSchedules, ...internalSchedules, ...customCalendarSchedules]} isProjectCalendar={false} />
        </div>
      </div>

      {/* <div className={classNames(s.sideBar)}></div> */}
    </div>
  )
}

export default index
