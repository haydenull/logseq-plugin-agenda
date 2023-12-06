import { useLocalStorageValue } from '@react-hookz/web'
import { useAtom } from 'jotai'
import { clone, set } from 'lodash-es'

import { type Settings, settingsAtom, type Filter } from '@/Agenda3/models/settings'

const isPlugin = import.meta.env.VITE_MODE === 'plugin'
const useSettings = () => {
  const [settings, setAtomSettings] = useAtom(settingsAtom)
  const { set: setLocalStorage, value: valueLocalStorage } = useLocalStorageValue<Settings>('settings')

  const setSettings = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
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
    const base: Settings = { isInitialized: true }
    if (isPlugin) {
      const _settings = (logseq.settings as unknown as Settings) ?? {}
      setAtomSettings(_settings ? { ..._settings, isInitialized: true } : base)
    } else {
      setAtomSettings(valueLocalStorage ? { ...valueLocalStorage, isInitialized: true } : base)
    }
  }
  return {
    settings,
    setSettings,
    initializeSettings,
  }
}

export default useSettings
