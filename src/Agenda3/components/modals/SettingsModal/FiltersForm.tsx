import { Button } from 'antd'
import { RiDeleteBin4Line, RiEdit2Line } from 'react-icons/ri'

import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter } from '@/Agenda3/models/settings'

import EditFilterModal from '../EditFilterModal'

const FiltersForm = () => {
  const { settings, setSettings } = useSettings()
  const oldFilters = settings.filters ?? []
  const oldSelectedFilters = settings.selectedFilters ?? []

  const onChange = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
  }

  return (
    <>
      <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">Filters</div>
      <div className="px-4 mt-4 pb-8">
        <div className="mt-4 flex flex-col gap-1">
          <EditFilterModal type="create" onOk={(filter) => onChange('filters', oldFilters.concat(filter))}>
            <Button>Create Filter</Button>
          </EditFilterModal>
          <div className="mt-4 flex flex-col gap-2">
            {settings.filters?.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between w-[300px] border rounded px-4 py-1.5 text-white"
                style={{ backgroundColor: filter.color }}
              >
                <span>{filter.name}</span>
                <div className="flex gap-3">
                  <EditFilterModal
                    type="edit"
                    key={filter.id}
                    initialValues={filter}
                    onOk={(newFilter) =>
                      onChange(
                        'filters',
                        oldFilters.map((f) => (f.id === filter.id ? newFilter : f)),
                      )
                    }
                  >
                    <RiEdit2Line className="cursor-pointer" />
                  </EditFilterModal>
                  <RiDeleteBin4Line
                    className="cursor-pointer "
                    onClick={() => {
                      onChange(
                        'filters',
                        oldFilters.filter((f) => f.id !== filter.id),
                      )
                      onChange(
                        'selectedFilters',
                        oldSelectedFilters.filter((id) => id !== filter.id),
                      )
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default FiltersForm
