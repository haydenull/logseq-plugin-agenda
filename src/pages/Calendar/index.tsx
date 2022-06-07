import classNames from 'classnames'
import { useAtom } from 'jotai'

import { schedulesAtom } from '@/model/schedule'
import CalendarCom from '@/components/Calendar'
import s from './index.module.less'
import { calendarSchedules } from '@/model/events'

const index = () => {
  const [schedules] = useAtom(calendarSchedules)

  console.log('[faiz:] === page calendar: schedules', schedules)

  return (
    <div className="page-container flex">
      <div className={classNames(s.content, 'flex flex-1 flex-col overflow-hidden p-8')} style={{ maxWidth: '1400px' }}>

        <h1 className="title-text">Calendar</h1>
        <div className="bg-quaternary flex flex-col flex-1 rounded-2xl box-border p-6">
          <CalendarCom schedules={schedules} isProjectCalendar={false} />
        </div>
      </div>

      {/* <div className={classNames(s.sideBar)}></div> */}
    </div>
  )
}

export default index
