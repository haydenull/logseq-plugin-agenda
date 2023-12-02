import React, { useState } from 'react'

import EndTimeSelect from '@/components/TaskModal/components/EndTimeSelect'
import TimeSelect from '@/components/TaskModal/components/TimeSelect'

const TimeDurationSelect = () => {
  const [startTime, setStartTime] = useState<string>()
  const [endTime, setEndTime] = useState<string>()
  return (
    <div className="flex items-center gap-1 border rounded-md mt-2">
      <TimeSelect placeholder="Start Time" value={startTime} onChange={setStartTime} />
      {'-'}
      <EndTimeSelect
        disabled={!startTime}
        placeholder="End Time"
        value={endTime}
        startTime={startTime}
        onChange={setEndTime}
      />
    </div>
  )
}

export default TimeDurationSelect
