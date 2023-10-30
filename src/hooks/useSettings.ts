import { useLocalStorageValue } from '@react-hookz/web'
import { useAtom } from 'jotai'
import { clone, set } from 'lodash-es'
import { useEffect } from 'react'

import { type Settings, settingsAtom } from '@/newModel/settings'

const useSettings = () => {
  const [settings, setAtomSettings] = useAtom(settingsAtom)
  const { set: setLocalStorage, value: valueLocalStorage } = useLocalStorageValue<Settings>('settings')

  const setSettings = (key: string, value: string) => {
    const newSettings = set(clone(settings), key, value)
    setLocalStorage(newSettings)
    setAtomSettings(newSettings)
  }
  // initial settings
  useEffect(() => {
    setAtomSettings(valueLocalStorage ?? {})
  }, [])
  return {
    settings,
    setSettings,
  }
}

export default useSettings
