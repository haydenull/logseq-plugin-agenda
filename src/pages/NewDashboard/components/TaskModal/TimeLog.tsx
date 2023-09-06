import { Calendar, Popover } from 'antd'
import dayjs from 'dayjs'
import React, { useState } from 'react'

import EndTimeSelect from '@/components/TaskModal/components/EndTimeSelect'
import TimeSelect from '@/components/TaskModal/components/TimeSelect'
import { TIME_FORMATTER } from '@/constants/agenda'
import { genDurationString } from '@/newHelper/block'
import type { TimeLog } from '@/types/task'
import { replaceTimeInfo } from '@/util/util'

const TimeLogComponent = ({ value, onChange }: { value: TimeLog; onChange: (value: TimeLog) => void }) => {
  const { start, end, amount } = value
  const [date, setDate] = useState(start)
  const startVal = start.format(TIME_FORMATTER)
  const endVal = end.format(TIME_FORMATTER)
  const updateStart = (val?: string) => {
    const _start = replaceTimeInfo(date, dayjs(val, TIME_FORMATTER))
    onChange({
      ...value,
      start: _start,
      end: _start.add(amount, 'minute'),
      amount,
    })
  }
  const updateEnd = (val?: string) => {
    const _end = replaceTimeInfo(date, dayjs(val, TIME_FORMATTER))
    onChange({
      ...value,
      end: _end,
      amount: _end.diff(start, 'minute'),
    })
  }
  return (
    <Popover
      trigger={['click']}
      arrow={false}
      placement="bottomLeft"
      content={
        <div className="w-[300px] p-2">
          <Calendar fullscreen={false} value={start} onChange={setDate} />
          <div className="flex items-center gap-1 border rounded-md mt-2">
            <TimeSelect placeholder="Start Time" value={startVal} onChange={updateStart} />
            {'-'}
            <EndTimeSelect
              disabled={!start}
              placeholder="End Time"
              value={endVal}
              startTime={startVal}
              onChange={updateEnd}
            />
          </div>
        </div>
      }
    >
      <div className="hover:bg-gray-100 px-3 py-1 rounded cursor-default text-gray-400 text-xs">
        {`${start.format('MM-DD')} ${start.format('HH:mm')}-${end.format('HH:mm')} (${genDurationString(amount)})`}
      </div>
    </Popover>
  )
}

export default TimeLogComponent
