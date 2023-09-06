import { Select, type SelectProps } from 'antd'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TIME_FORMATTER } from '@/constants/agenda'
import { padZero } from '@/util/util'

import s from '../index.module.less'

const genTimeItems = () => {
  const now = dayjs()
  const start = now.startOf('day')
  const items = new Array(48).fill(0).map((_, i) => {
    // every time interval is 30 minutes
    return start.add(i * 30, 'minute')
  })

  const firstItemIndex = items.findIndex((item) => item.isSameOrAfter(now, 'minutes'))
  const futureItems = items.slice(firstItemIndex)
  const pastItems = items.slice(0, firstItemIndex)
  return [...futureItems, ...pastItems]
}

const TimeSelect = ({
  value,
  onChange,
  ...props
}: { value?: string; onChange: (value?: string) => void } & SelectProps) => {
  const { t } = useTranslation()

  const baseOptions = genTimeItems().map((time) => {
    const timeStr = time.format(TIME_FORMATTER)
    return {
      label: timeStr,
      value: timeStr,
    }
  })
  const [options, setOptions] = useState(baseOptions)

  const handleSearch = (value: string) => {
    const [hourStr, minutesStr] = value.trim().split(':')
    const hour = parseInt(hourStr, 10)
    const minutes = parseInt(minutesStr, 10)
    if (isNaN(hour) || isNaN(minutes)) return
    if (hour > 23 || minutes > 59) return

    const timeStr = padZero(hour) + ':' + padZero(minutes)
    setOptions(
      baseOptions.concat({
        label: timeStr,
        value: timeStr,
      }),
    )
  }

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
      popupClassName="text-center pointer-events-auto"
      placeholder={t('Time')}
      options={options}
      {...props}
    />
  )
}

export default TimeSelect
