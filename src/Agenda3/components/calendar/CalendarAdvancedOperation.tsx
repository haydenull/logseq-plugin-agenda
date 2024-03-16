import { Button, Dropdown, Switch } from 'antd'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdCheckmark } from 'react-icons/io'

import useSettings from '@/Agenda3/hooks/useSettings'
import { cn } from '@/util/util'

export const CALENDAR_VIEWS = {
  dayGridMonth: 'dayGridMonth',
  timeGridWeek: 'timeGridWeek',
} as const
export type CalendarView = keyof typeof CALENDAR_VIEWS

const CalendarOperation = ({ value, onChange }: { value: CalendarView; onChange: (view: CalendarView) => void }) => {
  const { t } = useTranslation()

  const CALENDAR_OPTIONS = [
    { value: CALENDAR_VIEWS.dayGridMonth, label: t('Month') },
    // { value: 'dayGridWeek', label: '2 Weeks' },
    { value: CALENDAR_VIEWS.timeGridWeek, label: t('Week') },
  ]

  const { settings, setSettings } = useSettings()
  const [open, setOpen] = useState(false)

  const onClickItem = (view: CalendarView) => {
    onChange(view)
    setOpen(false)
  }

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => {
        return (
          <div className="rounded-md bg-white shadow-lg">
            <div className="flex flex-col gap-1 border-b py-2 px-2">
              {CALENDAR_OPTIONS.map((view) => {
                const isSelected = value === view.value
                return (
                  <div
                    key={view.value}
                    className={cn(
                      'flex min-w-[120px] cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-gray-300',
                      {
                        'bg-gray-200': isSelected,
                      },
                    )}
                    onClick={() => onClickItem(view.value)}
                  >
                    {view.label}
                    <IoMdCheckmark className={cn('invisible', { visible: isSelected })} />
                  </div>
                )
              })}
            </div>
            <div className="px-4 py-2">
              <span>{t('Hide Completed Tasks')}</span>
              <Switch
                size="small"
                className="ml-3"
                checked={settings.viewOptions?.hideCompleted}
                onChange={(checked) => setSettings('viewOptions.hideCompleted', checked)}
              />
            </div>
            {/* <SettingsModal initialTab="filters">
              <div
                onClick={() => setOpen(false)}
                className="text-blue-400 py-2 px-4 cursor-pointer hover:text-blue-500"
              >
                Edit Filters
              </div>
            </SettingsModal> */}
          </div>
        )
      }}
    >
      <Button className="!bg-transparent">{CALENDAR_OPTIONS.find((view) => view.value === value)?.label}</Button>
    </Dropdown>
  )
}

export default CalendarOperation
