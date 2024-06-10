import { useLocalStorageValue } from '@react-hookz/web'
import { Checkbox, Input, Select, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import { FaRegCircleQuestion } from 'react-icons/fa6'

import { DEFAULT_LOGSEQ_API_CONFIG, LOGSEQ_API_CONFIG_KEY } from '@/Agenda3/helpers/logseq'
import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter, Language } from '@/Agenda3/models/settings'

const GeneralSettingsForm = () => {
  const { t, i18n } = useTranslation()
  const { settings, setSettings } = useSettings()
  const { value: apiConfig, set: setApiConfig } = useLocalStorageValue(LOGSEQ_API_CONFIG_KEY, {
    defaultValue: DEFAULT_LOGSEQ_API_CONFIG,
    initializeWithValue: true,
  })

  const onChange = (key: string, value: number | string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
  }
  // 当切换语言时，更新 i18n 的语言
  const onLanguageChange = (value: Language) => {
    onChange('general.language', value)
    i18n.changeLanguage(value)
  }

  return (
    <>
      <div className="flex h-14 items-center border-b pl-4 text-lg font-semibold">{t('General Settings')}</div>
      <div className="mt-4 px-4 pb-8">
        <div className="mt-4 flex flex-col gap-1">
          <Checkbox
            checked={settings.general?.useJournalDayAsSchedule}
            onChange={(e) => onChange('general.useJournalDayAsSchedule', e.target.checked)}
          >
            <Tooltip title="When the task in the journal is not scheduled, use the date of the journal as the task date.">
              {t('Use Journal Day As Schedule')}
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
        <div className="mt-4">
          <div className="text-gray-500">Start of Week</div>
          <Select
            placeholder="Select Start of Week"
            className="w-[300px]"
            value={settings.general?.startOfWeek}
            onChange={(e) => onChange('general.startOfWeek', e)}
            options={[
              { label: 'Sun', value: 0 },
              { label: 'Mon', value: 1 },
              { label: 'Tue', value: 2 },
              { label: 'Wed', value: 3 },
              { label: 'Thu', value: 4 },
              { label: 'Fri', value: 5 },
              { label: 'Sat', value: 6 },
            ]}
          />
        </div>
        {import.meta.env.VITE_MODE === 'web' ? (
          <>
            <div className="mt-4">
              <div className="flex cursor-pointer items-center gap-2 text-gray-500">
                Logseq API Server
                <FaRegCircleQuestion title="This configuration requires reloading the page to take effect." />
              </div>
              <Input
                className="w-[300px]"
                placeholder={DEFAULT_LOGSEQ_API_CONFIG.apiServer}
                value={apiConfig?.apiServer}
                onChange={(e) =>
                  setApiConfig((config) => ({
                    ...config,
                    apiServer: e.target.value?.trim() || DEFAULT_LOGSEQ_API_CONFIG.apiServer,
                  }))
                }
              />
            </div>
            <div className="mt-4">
              <div className="flex cursor-pointer items-center gap-2 text-gray-500">
                Logseq API Token
                <FaRegCircleQuestion title="This configuration requires reloading the page to take effect." />
              </div>
              <Input.Password
                className="w-[300px]"
                placeholder={DEFAULT_LOGSEQ_API_CONFIG.apiToken}
                value={apiConfig?.apiToken}
                onChange={(e) =>
                  setApiConfig((config) => ({
                    ...config,
                    apiToken: e.target.value?.trim() || DEFAULT_LOGSEQ_API_CONFIG.apiToken,
                  }))
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}

export default GeneralSettingsForm
