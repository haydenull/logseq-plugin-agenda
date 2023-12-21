import { Checkbox, Select, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'

import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter, Language } from '@/Agenda3/models/settings'

const GeneralSettingsForm = () => {
  const { t, i18n } = useTranslation()
  const { settings, setSettings } = useSettings()

  const onChange = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
  }
  // 当切换语言时，更新 i18n 的语言
  const onLanguageChange = (value: Language) => {
    onChange('general.language', value)
    i18n.changeLanguage(value)
  }

  return (
    <>
      <div className="flex h-14 items-center border-b pl-4 text-lg font-semibold">General Settings</div>
      <div className="mt-4 px-4 pb-8">
        <div className="mt-4 flex flex-col gap-1">
          <Checkbox
            checked={settings.general?.useJournalDayAsSchedule}
            onChange={(e) => onChange('general.useJournalDayAsSchedule', e.target.checked)}
          >
            <Tooltip title="When the task in the journal is not scheduled, use the date of the journal as the task date.">
              Use Journal Day As Schedule
            </Tooltip>
          </Checkbox>
        </div>
        <div className="mt-4">
          <div className="text-gray-500">Language</div>
          <Select
            placeholder="Select language"
            className="w-[300px]"
            value={settings.general?.language}
            onChange={onLanguageChange}
            options={[
              { label: 'English', value: 'en' },
              { label: '简体中文', value: 'zh-CN' },
            ]}
          />
        </div>
      </div>
    </>
  )
}

export default GeneralSettingsForm
