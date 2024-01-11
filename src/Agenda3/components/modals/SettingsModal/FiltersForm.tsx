import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { RiDeleteBin4Line, RiEdit2Line } from 'react-icons/ri'
import { ReactSortable } from 'react-sortablejs'

import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter } from '@/Agenda3/models/settings'

import EditFilterModal from '../EditFilterModal'

const FiltersForm = () => {
  const { t } = useTranslation()
  const { settings, setSettings } = useSettings()
  const oldFilters = settings.filters ?? []
  const oldSelectedFilters = settings.selectedFilters ?? []

  const onChange = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
  }

  return (
    <>
      <div className="flex h-14 items-center border-b pl-4 text-lg font-semibold">{t('Filters')}</div>
      <div className="mt-4 px-4 pb-8">
        <div className="mt-4 flex flex-col gap-1">
          <EditFilterModal type="create" onOk={(filter) => onChange('filters', oldFilters.concat(filter))}>
            <Button>{t('Create Filter')}</Button>
          </EditFilterModal>
          {settings.filters?.length ? (
            <ReactSortable
              animation={80}
              className="mt-4"
              list={settings.filters}
              setList={(newFilters) => onChange('filters', newFilters)}
            >
              {settings.filters?.map((filter) => (
                <div
                  key={filter.id}
                  className="mb-2 flex w-[300px] items-center justify-between rounded border px-4 py-1.5 text-white"
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
            </ReactSortable>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default FiltersForm
