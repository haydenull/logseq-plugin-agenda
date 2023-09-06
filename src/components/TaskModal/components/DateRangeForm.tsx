import { Checkbox, DatePicker } from 'antd'
import { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'

import { type DateFormValue } from '..'

const DateRangeForm = ({ value, onChange }: { value?: DateFormValue; onChange: (value: DateFormValue) => void }) => {
  const { t } = useTranslation()

  const onAllDayChange = (e) => {
    onChange({
      ...value,
      isAllDay: e.target.checked,
    })
  }
  const onDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    const [start, end] = dates ?? []
    if (!start || !end) return

    onChange({ ...value, start, end })
  }

  return (
    <div>
      <Checkbox checked={value?.isAllDay} onChange={onAllDayChange}>
        {t('All Day')}
      </Checkbox>
      <DatePicker.RangePicker
        open
        showTime={!value?.isAllDay}
        showSecond={false}
        className="!mt-2"
        popupClassName="pointer-events-auto"
        onChange={onDateChange}
      />
    </div>
  )
}

export default DateRangeForm
