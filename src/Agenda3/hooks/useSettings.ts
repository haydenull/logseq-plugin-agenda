import { useLocalStorageValue } from '@react-hookz/web'
import { useAtom } from 'jotai'
import { clone, set, merge } from 'lodash-es'

import { type Settings, settingsAtom, type Filter, DEFAULT_SETTINGS } from '@/Agenda3/models/settings'
import initializeDayjs from '@/register/dayjs'

const isPlugin = import.meta.env.VITE_MODE === 'plugin'
const useSettings = () => {
  const [settings, setAtomSettings] = useAtom(settingsAtom)
  const { set: setLocalStorage, value: valueLocalStorage } = useLocalStorageValue<Settings>('settings')

  const setSettings = (key: string, value: number | string | boolean | undefined | Filter[] | string[]) => {
    if (key === 'general.startOfWeek') {
      initializeDayjs(Number(value))
    }
    setAtomSettings((oldSettings) => {
      const newSettings = set(clone(oldSettings), key, value)
      if (isPlugin) {
        if (Array.isArray(value)) {
          // clear old settings, issue: https://github.com/logseq/logseq/issues/4447
          const _newSettings = set(clone(oldSettings), key, null)
          logseq.updateSettings(_newSettings)
        }
        logseq.updateSettings(newSettings)
      } else {
        setLocalStorage(newSettings)
      }
      return newSettings
    })
  }
  // initialize settings
  const initializeSettings = () => {
    const getNewSettings = (userSettings?: Settings) => {
      return merge({}, DEFAULT_SETTINGS, userSettings, { isInitialized: true })
    }
    const userSettings = isPlugin ? (logseq.settings as unknown as Settings) : valueLocalStorage
    initializeDayjs(userSettings?.general?.startOfWeek ?? DEFAULT_SETTINGS.general.startOfWeek)
    setAtomSettings(getNewSettings(userSettings))
  }
  return {
    settings,
    setSettings,
    initializeSettings,
  }
}

export default useSettings
