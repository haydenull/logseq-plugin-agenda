import { useEffect, useState } from 'react'

import { DEFAULT_SETTINGS } from '@/util/constants'
import { getCurrentTheme } from '@/util/logseq'
import type { ISettingsForm } from '@/util/type'

export default function useTheme() {
  const [theme, setTheme] = useState<ISettingsForm['lightThemeType'] | 'dark'>(DEFAULT_SETTINGS.lightThemeType)

  useEffect(() => {
    getCurrentTheme().then((logseqTheme) => {
      setTheme(logseqTheme)
    })
  })

  return theme
  // return 'dark'
}
