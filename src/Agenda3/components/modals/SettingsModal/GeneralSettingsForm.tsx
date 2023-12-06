import { Checkbox, Tooltip } from 'antd'

import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter } from '@/Agenda3/models/settings'

const GeneralSettingsForm = () => {
  const { settings, setSettings } = useSettings()

  const onChange = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
  }

  return (
    <>
      <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">General Settings</div>
      <div className="px-4 mt-4 pb-8">
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
      </div>
    </>
  )
}

export default GeneralSettingsForm
