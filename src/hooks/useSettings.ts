import { useLocalStorageValue } from '@react-hookz/web'
import { useAtom } from 'jotai'
import { clone, set } from 'lodash-es'
import { useEffect } from 'react'

import { type Settings, settingsAtom, type Filter } from '@/newModel/settings'

const isPlugin = import.meta.env.VITE_MODE === 'plugin'
const useSettings = () => {
  const [settings, setAtomSettings] = useAtom(settingsAtom)
  const { set: setLocalStorage, value: valueLocalStorage } = useLocalStorageValue<Settings>('settings')

  const setSettings = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    const newSettings = set(clone(settings), key, value)
    setAtomSettings(newSettings)
    if (isPlugin) {
      const oldSettings = logseq.settings ?? {}
      logseq.updateSettings({
        ...oldSettings,
        ...newSettings,
      })
    } else {
      setLocalStorage(newSettings)
    }
  }
  // initial settings
  useEffect(() => {
    if (isPlugin) {
      setAtomSettings((logseq.settings as Settings) ?? {})
    } else {
      setAtomSettings(valueLocalStorage ?? {})
    }
  }, [])
  return {
    settings,
    setSettings,
  }
}

export default useSettings
