import { Checkbox } from 'antd'

import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter } from '@/Agenda3/models/settings'

const ViewOptionsForm = () => {
  const { settings, setSettings } = useSettings()

  const onChange = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
  }

  return (
    <>
      <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">View Options</div>
      <div className="px-4 mt-4 pb-8">
        <div className="mt-4 flex flex-col gap-1">
          <Checkbox
            checked={settings.viewOptions?.showFirstEventInCycleOnly}
            onChange={(e) => onChange('viewOptions.showFirstEventInCycleOnly', e.target.checked)}
          >
            Only Show First Event In Cycle
          </Checkbox>
          <Checkbox
            checked={settings.viewOptions?.showTimeLog}
            onChange={(e) => onChange('viewOptions.showTimeLog', e.target.checked)}
          >
            Show Time Log
          </Checkbox>
        </div>
        <div className="mt-4">
          <div className="text-gray-500">Calendar</div>
          <Checkbox
            checked={settings.viewOptions?.hideCompleted}
            onChange={(e) => onChange('viewOptions.hideCompleted', e.target.checked)}
          >
            Hide Completed Tasks
          </Checkbox>
        </div>
      </div>
    </>
  )
}

export default ViewOptionsForm
