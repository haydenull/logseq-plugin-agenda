import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AiOutlineClose } from 'react-icons/ai'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/util/util'

import { type PriorityValue } from '..'

const PrioritySelect = ({ value, onChange }: { value?: PriorityValue; onChange: (value?: PriorityValue) => void }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const priorities = [
    { value: 'A', label: t('Priority') + ' A', textClassName: 'text-red-500', borderClassName: 'border-red-500' },
    { value: 'B', label: t('Priority') + ' B', textClassName: 'text-yellow-500', borderClassName: 'border-yellow-500' },
    { value: 'C', label: t('Priority') + ' C', textClassName: 'text-green-500', borderClassName: 'border-green-500' },
  ] as const
  const activeItem = priorities.find(({ value: _value }) => _value === value)

  const onClickItem = (value) => {
    setOpen(false)
    onChange(value)
  }
  const onClickClear = () => {
    onChange(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div
          className={cn(
            'border px-2 py-0.5 rounded-md text-gray-500 text-sm flex items-center gap-1.5',
            activeItem?.borderClassName,
          )}
        >
          {activeItem ? activeItem.label : t('Priority')}
          <AiOutlineClose className="text-sm text-zinc-300 hover:text-gray-500" onClick={onClickClear} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[100px] px-1 py-1 gap-1 flex flex-col">
        {priorities.map(({ value: _value, label, textClassName }) => (
          <div
            key={_value}
            className={cn(
              'hover:bg-slate-100 rounded px-2 py-1 cursor-default text-sm',
              textClassName,
              _value == value ? 'bg-slate-300 hover:bg-slate-300' : '',
            )}
            onClick={() => onClickItem(_value)}
          >
            {label}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export default PrioritySelect
