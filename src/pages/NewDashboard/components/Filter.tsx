import { Badge, Button, Dropdown } from 'antd'
import React, { useState } from 'react'
import { FiFilter } from 'react-icons/fi'
import { IoMdCheckmark } from 'react-icons/io'

import useSettings from '@/hooks/useSettings'
import { type Filter as IFilter } from '@/newModel/settings'
import { cn } from '@/util/util'

import SettingsModal from './SettingsModal'

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
          <div className="bg-white rounded-md shadow-lg">
            {settings.filters?.length ? (
              <div className="border-b py-2 px-2 flex flex-col gap-1">
                {settings.filters.map((filter) => {
                  const isSelected = settings.selectedFilters?.includes(filter.id)
                  return (
                    <div
                      key={filter.id}
                      className={cn(
                        'flex items-center justify-between gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-300 min-w-[120px]',
                        {
                          'bg-gray-200': isSelected,
                        },
                      )}
                      onClick={() => onClickItem(filter)}
                    >
                      {filter.name}
                      <IoMdCheckmark className={cn('invisible', { visible: isSelected })} />
                    </div>
                  )
                })}
              </div>
            ) : null}
            <SettingsModal initialTab="filters">
              <div
                onClick={() => setOpen(false)}
                className="text-blue-400 py-2 px-4 cursor-pointer hover:text-blue-500"
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
          <FiFilter className="text-lg cursor-pointer" />
        </Badge>
      </div>
    </Dropdown>
  )
}

export default Filter
