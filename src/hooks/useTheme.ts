import { ISettingsForm } from '@/util/type'
import { getCurrentTheme } from '@/util/logseq'
import { DEFAULT_SETTINGS } from '@/util/constants'
import { useEffect, useState } from 'react'

export default function useTheme() {
  const [theme, setTheme] = useState<ISettingsForm['lightThemeType'] | 'dark'>(DEFAULT_SETTINGS.lightThemeType)

  useEffect(() => {
    getCurrentTheme().then(logseqTheme => {
      console.log('[faiz:] === getCurrentTheme', logseqTheme)
      setTheme(logseqTheme)
    })
  })

  return theme
}