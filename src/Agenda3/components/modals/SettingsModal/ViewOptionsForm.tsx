import { Checkbox } from 'antd'
import { useTranslation } from 'react-i18next'

import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter } from '@/Agenda3/models/settings'

const ViewOptionsForm = () => {
  const { t } = useTranslation()
  const { settings, setSettings } = useSettings()

  const onChange = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
  }

  return (
    <>
      <div className="flex h-14 items-center border-b pl-4 text-lg font-semibold">{t('View Options')}</div>
      <div className="mt-4 px-4 pb-8">
        <div className="mt-4 flex flex-col gap-1">
          <Checkbox
            checked={settings.viewOptions?.showFirstEventInCycleOnly}
            onChange={(e) => onChange('viewOptions.showFirstEventInCycleOnly', e.target.checked)}
          >
            {t('Only Show First Event In Cycle')}
          </Checkbox>
          <Checkbox
            checked={settings.viewOptions?.showTimeLog}
            onChange={(e) => onChange('viewOptions.showTimeLog', e.target.checked)}
          >
            {t('Show Time Log')}
          </Checkbox>
        </div>
        <div className="mt-4">
          <div className="text-gray-500">{t('Calendar')}</div>
          <Checkbox
            checked={settings.viewOptions?.hideCompleted}
            onChange={(e) => onChange('viewOptions.hideCompleted', e.target.checked)}
          >
            {t('Hide Completed Tasks')}
          </Checkbox>
        </div>
      </div>
    </>
  )
}

export default ViewOptionsForm
