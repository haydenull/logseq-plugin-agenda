import { DatePicker, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'

import type { AgendaEntityObjective } from '@/types/objective'

type PeriodPickerProps = {
  onChange?: (objective: AgendaEntityObjective) => void
  initialValue?: AgendaEntityObjective
}
type PeriodType = AgendaEntityObjective['type']

const PeriodPicker = ({ onChange, initialValue }: PeriodPickerProps) => {
  const [type, setType] = useState<PeriodType>(initialValue?.type || 'week')
  const [date, setDate] = useState<Dayjs | null>(
    initialValue
      ? initialValue.type === 'week'
        ? dayjs().year(initialValue.year).week(initialValue.number)
        : dayjs()
            .year(initialValue.year)
            .month(initialValue.number - 1)
      : null,
  )

  const emitOnChange = (newType: PeriodType, newDate: Dayjs | null) => {
    if (newDate) {
      const objective: AgendaEntityObjective = {
        type: newType,
        year: newDate.year(),
        number: newType === 'week' ? newDate.isoWeek() : newDate.month() + 1,
      }
      onChange && onChange(objective)
    }
  }
  const onTypeChange = (newType: PeriodType) => {
    setType(newType)
    emitOnChange(newType, date)
  }
  const onDateChange = (newDate: Dayjs | null) => {
    setDate(newDate)
    emitOnChange(type, newDate)
  }

  return (
    <>
      <Select
        options={[
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ]}
        value={type}
        onChange={onTypeChange}
      />
      <DatePicker picker={type} value={date} onChange={onDateChange} allowClear={false} />
    </>
  )
}

export default PeriodPicker
