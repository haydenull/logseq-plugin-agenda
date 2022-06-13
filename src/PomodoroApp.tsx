import React, { useEffect, useState } from 'react'
import { secondsToTime } from './util/util'

const PomodoroApp: React.FC<{
  duration: number
  uuid: string
  initialStatus?: string
  initialTimer?: number
  doneCount?: number
}> = ({ duration, uuid, initialStatus }) => {
  const [time, setTime] = useState(duration)

  const start = () => {
    logseq.Editor.updateBlock(uuid, `test {{renderer agenda, pomodoro-timer, 40, 'timing', 0}}`)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[faiz:] === setInterval')
      setTime(time => {
        if (time <= 0) {
          clearInterval(interval)
          logseq.Editor.updateBlock(uuid, `test {{renderer agenda, pomodoro-timer, 40, 'end', 1}}`)
          console.log('[faiz:] === time end', uuid)
          return 0
        }
        return time - 1
      })
    }, 1000)
    console.log('[faiz:] === PomodoroApp interval created', uuid, interval)
    return () => clearInterval(interval)
  }, [uuid])

  return (
    <div>
      {secondsToTime(time)}
      <i>{initialStatus}</i>
      <b>start</b>
    </div>
  )
}

export default PomodoroApp
