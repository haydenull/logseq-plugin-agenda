import { AutoComplete, type AutoCompleteProps } from 'antd'
import { useTranslation } from 'react-i18next'

import { cn } from '@/util/util'

import s from '../index.module.less'

const options = [
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '45m', value: '45m' },
  { label: '1h', value: '1h' },
  { label: '1h30m', value: '1h30m' },
  { label: '2h', value: '2h' },
  { label: '2h30m', value: '2h30m' },
  { label: '3h', value: '3h' },
  { label: '4h', value: '4h' },
]

const DurationSelect = ({
  className,
  value,
  onChange,
  ...props
}: {
  className?: string
  value?: string
  onChange: (value: string) => void
} & AutoCompleteProps) => {
  const { t } = useTranslation()

  return (
    <AutoComplete
      backfill
      allowClear
      filterOption
      value={value}
      onChange={onChange}
      className={cn('w-full', s.centerSelectText, className)}
      popupClassName="pointer-events-auto"
      placeholder={t('Duration')}
      options={options}
      {...props}
    />
  )
}

export default DurationSelect
