import { Typography } from 'antd'
import classNames from 'classnames'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { type ISchedule } from 'tui-calendar'

import CalendarCom from '@/components/Calendar'
import { fullCalendarSchedulesAtom } from '@/model/events'
import { subscriptionSchedulesAtom } from '@/model/schedule'
import { getCustomCalendarSchedules } from '@/util/schedule'

import s from './index.module.less'

const Index = () => {
  const [internalSchedules] = useAtom(fullCalendarSchedulesAtom)
  const [subscriptionSchedules] = useAtom(subscriptionSchedulesAtom)
  const [customCalendarSchedules, setCustomCalendarSchedules] = useState<ISchedule[]>([])

  useEffect(() => {
    getCustomCalendarSchedules().then((res) => {
      setCustomCalendarSchedules(res)
    })
  }, [])

  return (
    <div className="page-container flex">
      <div className={classNames(s.content, 'flex flex-1 flex-col overflow-hidden p-8')} style={{ maxWidth: '1800px' }}>
        <Typography.Title className="title-text" level={3}>
          Calendar
        </Typography.Title>
        <div className="bg-quaternary flex flex-col flex-1 rounded-2xl box-border p-6">
          <CalendarCom
            schedules={[...subscriptionSchedules, ...internalSchedules, ...customCalendarSchedules]}
            isProjectCalendar={false}
          />
        </div>
      </div>

      {/* <div className={classNames(s.sideBar)}></div> */}
    </div>
  )
}

export default Index
