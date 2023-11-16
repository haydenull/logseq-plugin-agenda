import { Button, Dropdown } from 'antd'
import React, { useState } from 'react'

import useSettings from '@/hooks/useSettings'

const Filter = () => {
  const { settings, setSettings } = useSettings()
  const [open, setOpen] = useState(false)
  return (
    <Dropdown
      // open={open}
      trigger={['click']}
      dropdownRender={(menus) => {
        return <div>xxxx</div>
      }}
      menu={{
        items: settings.filters?.map((filter) => ({ key: filter.id, label: filter.name })),
        multiple: true,
        selectable: true,
        selectedKeys: settings.selectedFilters,
        onClick: ({ key }) => {
          console.log('[faiz:] === key', key)
          console.log('[faiz:] === settings.selectedFilters', settings.selectedFilters)
          if (settings.selectedFilters?.includes(key)) {
            setSettings(
              'selectedFilters',
              settings.selectedFilters?.filter((item) => item !== key),
            )
            return
          }
          const selectedKeys = [...(settings.selectedFilters || []), key]
          setSettings('selectedFilters', selectedKeys)
        },
      }}
    >
      <Button className="bg-transparent">
        Filter{settings.selectedFilters?.length ? ` (${settings.selectedFilters.length})` : ''}
      </Button>
    </Dropdown>
  )
}

export default Filter
