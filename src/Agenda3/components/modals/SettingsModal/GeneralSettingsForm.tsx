import { Checkbox, Select, Tooltip } from 'antd'

import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter } from '@/Agenda3/models/settings'

const GeneralSettingsForm = () => {
  const { settings, setSettings } = useSettings()

  const onChange = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
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
            onChange={(value) => onChange('general.language', value)}
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
