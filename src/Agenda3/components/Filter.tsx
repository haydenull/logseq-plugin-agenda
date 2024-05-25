import { Badge, Dropdown } from 'antd'
import React, { useState } from 'react'
import { FiFilter } from 'react-icons/fi'
import { IoMdCheckmark } from 'react-icons/io'

import useSettings from '@/Agenda3/hooks/useSettings'
import { type Filter as IFilter } from '@/Agenda3/models/settings'
import { cn } from '@/util/util'

import SettingsModal from './modals/SettingsModal'

const Filter = () => {
  const { settings, setSettings } = useSettings()
  const [open, setOpen] = useState(false)

  const onClickItem = (filter: IFilter) => {
    const { id } = filter
    if (settings.selectedFilters?.includes(id)) {
      setSettings(
        'selectedFilters',
        settings.selectedFilters?.filter((item) => item !== id),
      )
      return
    }
    const selectedKeys = [...new Set([...(settings.selectedFilters || []), id])]
    setSettings('selectedFilters', selectedKeys)
  }

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => {
        return (
          <div className="rounded-md bg-white shadow-lg dark:bg-[#333]">
            {settings.filters?.length ? (
              <div className="flex flex-col gap-1 border-b px-2 py-2">
                {settings.filters.map((filter) => {
                  const isSelected = settings.selectedFilters?.includes(filter.id)
                  return (
                    <div
                      key={filter.id}
                      className={cn(
                        'flex min-w-[120px] cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-gray-300 dark:bg-[#333] dark:hover:bg-[#555]',
                        {
                          'bg-gray-200 dark:bg-[#444]': isSelected,
                        },
                      )}
                      onClick={() => onClickItem(filter)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: filter.color }}></span>
                        {filter.name}
                      </div>
                      <IoMdCheckmark className={cn('invisible', { visible: isSelected })} />
                    </div>
                  )
                })}
              </div>
            ) : null}
            <SettingsModal initialTab="filters">
              <div
                onClick={() => setOpen(false)}
                className="cursor-pointer px-4 py-2 text-blue-400 hover:text-blue-500"
              >
                Edit Filters
              </div>
            </SettingsModal>
          </div>
        )
      }}
    >
      <div className="flex items-center">
        <Badge count={settings.selectedFilters?.length} size="small" color="#60A5FA">
          <FiFilter className="cursor-pointer text-lg" />
        </Badge>
      </div>
    </Dropdown>
  )
}

export default Filter
