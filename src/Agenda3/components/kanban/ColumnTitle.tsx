import { message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

import PlannerModal from '../modals/PlannerModal'

const ColumnTitle = ({ day }: { day: Dayjs }) => {
  const today = dayjs()
  const isToday = day.isSame(today, 'day')
  const isTomorrow = day.isSame(today.add(1, 'day'), 'day')
  const isFuture = day.isAfter(today, 'day')
  return (
    <div className="flex items-center justify-between">
      <div className="text-2xl flex gap-2 items-center">
        <span>{day.format('ddd')}</span>
        <span className="text-gray-400">{day.format('MMM DD')}</span>
        {/* {isToday ? <span className="px-1 py-0.5 text-xs bg-blue-400 rounded text-white">Today</span> : null} */}
      </div>
      <div className="flex gap-2 items-center">
        {isToday ? (
          <PlannerModal type="today" triggerClassName="text-[10px] text-gray-400 hover:text-gray-700 cursor-pointer">
            Plan
          </PlannerModal>
        ) : null}
        {isTomorrow ? (
          <PlannerModal type="tomorrow" triggerClassName="text-[10px] text-gray-400 hover:text-gray-700 cursor-pointer">
            Plan
          </PlannerModal>
        ) : null}
        {isFuture ? null : (
          <span
            className="text-[10px] text-gray-400 hover:text-gray-700 cursor-pointer"
            onClick={() => message.info('Coming soon.')}
          >
            Review
          </span>
        )}
      </div>
    </div>
  )
}

export default ColumnTitle
