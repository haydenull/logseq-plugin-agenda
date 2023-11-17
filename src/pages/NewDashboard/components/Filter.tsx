import { Button, Dropdown } from 'antd'
import React, { useState } from 'react'

// import { IoMdCheckmark } from 'react-icons/io'
// import {  type Filter } from '@/newModel/settings'

// import useSettings from '@/hooks/useSettings'

// import SettingsModal from './SettingsModal'
// import { cn } from '@/util/util'

const Filter = () => {
  // const { settings, setSettings } = useSettings()
  // const [open, setOpen] = useState(false)

  // const onClickItem = (filter: Filter) => {
  //   const { id } = filter
  //   if (settings.selectedFilters?.includes(id)) {
  //     setSettings(
  //       'selectedFilters',
  //       settings.selectedFilters?.filter((item) => item !== id),
  //     )
  //     return
  //   }
  //   const selectedKeys = [...(settings.selectedFilters || []), id]
  //   setSettings('selectedFilters', selectedKeys)
  // }

  return (
    <Dropdown
    // trigger={['click']}
    // open={open}
    // onOpenChange={setOpen}
    // dropdownRender={() => {
    //   return (
    //     <div className="bg-white rounded-md shadow-lg">
    //       <div className="border-b py-2 px-2 flex flex-col gap-1">
    //         {settings.filters?.map((filter) => {
    //           const isSelected = settings.selectedFilters?.includes(filter.id)
    //           return <div key={filter.id} className={cn('flex items-center justify-between gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-300', {
    //             'bg-gray-200': isSelected,
    //           })} onClick={() => onClickItem(filter)}>
    //             {filter.name}
    //             <IoMdCheckmark className={cn('invisible', {'visible': isSelected})} />
    //           </div>
    //         })}
    //       </div>
    //       <SettingsModal initialTab="filters">
    //         <div onClick={() => setOpen(false)} className="text-blue-400 py-2 px-4 cursor-pointer hover:text-blue-500">Edit Filters</div>
    //       </SettingsModal>
    //     </div>
    //   )
    // }}
    >
      <Button type="text">
        {/* Filter{settings.selectedFilters?.length ? `(${settings.selectedFilters.length})` : ' '} */}
      </Button>
    </Dropdown>
  )
}

export default Filter
