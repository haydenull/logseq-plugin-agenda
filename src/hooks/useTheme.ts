import { ISettingsForm } from '@/util/type'
import { getCurrentTheme } from '@/util/logseq'
import { DEFAULT_SETTINGS } from '@/util/constants'
import { useEffect, useState } from 'react'

export default function useTheme() {
  const [theme, setTheme] = useState<ISettingsForm['lightTheme'] | 'dark'>(DEFAULT_SETTINGS.lightTheme)

  useEffect(() => {
    getCurrentTheme().then(logseqTheme => {
      setTheme(logseqTheme)
    })
  })

  return theme
}