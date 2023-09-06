import { message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Calendar } from '@/components/ui/calendar'
import { TIME_FORMATTER } from '@/constants/agenda'
import { replaceDateInfo, replaceTimeInfo } from '@/util/util'

import { type DateFormValue } from '..'
import DateShortcutBar from './DateShortcutBar'
import EndTimeSelect from './EndTimeSelect'
import TimeSelect from './TimeSelect'

const DateForm = ({ value, onChange }: { value?: DateFormValue; onChange: (value: DateFormValue) => void }) => {
  const { t } = useTranslation()
  const [isUseDefaultDuration, setIsUseDefaultDuration] = useState(true)
  const [messageApi, contextHolder] = message.useMessage()
  const calendarDate = value?.start ? value.start.toDate() : undefined
  const startTime = value?.isAllDay === false ? value?.start?.format(TIME_FORMATTER) : ''
  const endTime = value?.isAllDay === false ? value?.end?.format(TIME_FORMATTER) : ''

  // const duration = value?.start && value?.end ? value.end.diff(value.start, DURATION_UNIT) : 30

  const onCalendarSelect = (date: Dayjs) => {
    if (!value?.isAllDay && value?.start && value?.end) {
      // retain the original time information and replace date information with new date
      const { start, end } = value
      onChange({
        isAllDay: false,
        start: replaceDateInfo(start, date),
        end: replaceDateInfo(end, date),
      })
      return
    }

    onChange({
      isAllDay: true,
      start: date.startOf('day'),
      end: date.endOf('day'),
    })
  }
  const onStartTimeChange = (time?: string) => {
    if (!time) {
      onChange({ ...value, isAllDay: true })
      return
    }

    const day = value?.start ?? dayjs()
    const start = dayjs(day.format('YYYY-MM-DD') + ' ' + time)
    if (!value?.end || isUseDefaultDuration) {
      onChange({ isAllDay: false, start, end: start.add(30, 'minute') })
      return
    }

    if (start.isSame(value?.end, 'minute')) {
      messageApi.error(t('Start time cannot be the same as the end time'))
      return
    }

    if (start.isBefore(value?.end, 'minute')) {
      onChange({ isAllDay: false, start, end: value.end })
      return
    }

    onChange({
      isAllDay: false,
      start: value.end,
      end: start,
    })
  }
  const onEndTimeChange = (time: string) => {
    if (!time) {
      onChange({ ...value, isAllDay: true })
      return
    }
    if (!value?.start) return
    setIsUseDefaultDuration(false)
    onChange({
      ...value,
      isAllDay: false,
      end: replaceTimeInfo(value.start, dayjs(time, TIME_FORMATTER)),
    })
  }
  // const onDurationChange = (duration: string) => {
  //   console.log('[faiz:] === onDurationChange duration', duration)
  //   if (!value?.start || value.isAllDay !== false) return

  //   const end = value.start.add(Number(duration.replace(DURATION_UNIT.charAt(0), '')), DURATION_UNIT)
  //   console.log('[faiz:] === end', end)
  //   onChange({
  //     isAllDay: false,
  //     start: value.start,
  //     end,
  //   })
  // }

  return (
    <>
      {contextHolder}
      <DateShortcutBar onSelect={onCalendarSelect} />
      <Calendar
        mode="single"
        selected={calendarDate}
        onSelect={(date) => onCalendarSelect(dayjs(date))}
        className="w-full p-0 mt-2"
      />
      <div className="flex items-center gap-1 border rounded-md mt-2">
        <TimeSelect
          placeholder="Start Time"
          value={value?.isAllDay === false ? startTime : undefined}
          onChange={onStartTimeChange}
        />
        {'-'}
        <EndTimeSelect
          disabled={value?.isAllDay || !startTime}
          placeholder="End Time"
          value={value?.isAllDay === false ? endTime : undefined}
          startTime={startTime}
          onChange={onEndTimeChange}
        />
      </div>
      {/* <DurationSelect
        className="!mt-2"
        value={duration ? duration + DURATION_UNIT.charAt(0) : ''}
        onChange={onDurationChange}
      /> */}
    </>
  )
}

export default DateForm
