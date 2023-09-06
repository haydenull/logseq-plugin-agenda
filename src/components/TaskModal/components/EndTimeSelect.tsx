import { Select, type SelectProps } from 'antd'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TIME_FORMATTER } from '@/constants/agenda'
import { padZero } from '@/util/util'

import s from '../index.module.less'

const genTimeItems = (startTime?: string) => {
  const start = startTime ? dayjs(startTime, TIME_FORMATTER) : dayjs()

  const items15 = new Array(3).fill(0).map((_, i) => {
    return start.add((i + 1) * 15, 'minute')
  })
  const items30 = new Array(48)
    .fill(0)
    .map((_, i) => {
      return start.add((i + 1) * 30, 'minute')
    })
    .slice(1)

  return [...items15, ...items30].filter((item) => item.isSame(start, 'day'))
}
const genOptions = (startTime?: string) => {
  return genTimeItems(startTime).map((time) => {
    const timeStr = time.format(TIME_FORMATTER)
    const diff = time.diff(dayjs(startTime, TIME_FORMATTER), 'minute')
    const diffStr = diff < 60 ? `${diff}m` : `${diff / 60}h`
    return {
      label: `${timeStr}(${diffStr})`,
      value: timeStr,
    }
  })
}

const EndTimeSelect = ({
  startTime,
  value,
  onChange,
  ...props
}: { startTime?: string; value?: string; onChange: (value: string) => void } & SelectProps) => {
  const { t } = useTranslation()

  const [options, setOptions] = useState(genOptions(startTime))

  const handleSearch = (value: string) => {
    const [hourStr, minutesStr] = value.trim().split(':')
    const hour = parseInt(hourStr, 10)
    const minutes = parseInt(minutesStr, 10)
    if (isNaN(hour) || isNaN(minutes)) return
    if (hour > 23 || minutes > 59) return

    const startDay = startTime ? dayjs(startTime, TIME_FORMATTER) : dayjs()
    const timeStr = padZero(hour) + ':' + padZero(minutes)
    const inputDay = dayjs(timeStr, TIME_FORMATTER)
    if (inputDay.isBefore(startDay, 'minute')) return

    const diff = inputDay.diff(startDay, 'minute')
    const diffStr = diff < 60 ? `${diff}m` : `${diff / 60}h`
    setOptions(
      genOptions(startTime).concat({
        label: `${timeStr}(${diffStr})`,
        value: timeStr,
      }),
    )
  }

  useEffect(() => {
    setOptions(genOptions(startTime))
  }, [startTime])

  return (
    <Select
      allowClear
      showSearch
      suffixIcon={null}
      bordered={false}
      value={value}
      onChange={onChange}
      onSearch={handleSearch}
      className={clsx('w-full text-center', s.centerSelectText)}
      popupClassName="pointer-events-auto"
      placeholder={t('Time')}
      options={options}
      {...props}
    />
  )
}

export default EndTimeSelect
