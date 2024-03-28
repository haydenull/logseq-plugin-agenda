import { createContext, useContext, useEffect, useState } from 'react'

type ThemeSetting = 'dark' | 'light' | 'system'
type CURRENT_THEME = 'dark' | 'light'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultThemeSetting?: ThemeSetting
  storageKey?: string
}

type ThemeProviderState = {
  currentTheme: CURRENT_THEME
  themeSetting: ThemeSetting
  setThemeSetting: (theme: ThemeSetting) => void
}

const initialState: ThemeProviderState = {
  currentTheme: 'dark',
  themeSetting: 'system',
  setThemeSetting: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultThemeSetting = 'system',
  storageKey = 'agenda-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(
    () => (localStorage.getItem(storageKey) as ThemeSetting) || defaultThemeSetting,
  )
  const [currentTheme, setCurrentTheme] = useState<CURRENT_THEME>(initialState.currentTheme)

  // update the theme class on the root element and currentTheme state
  function updateTheme(themeSetting: ThemeSetting) {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (themeSetting === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      setCurrentTheme(systemTheme)
      return
    }
    root.classList.add(themeSetting)
    setCurrentTheme(themeSetting)
  }

  useEffect(() => {
    updateTheme(themeSetting)
  }, [themeSetting])

  useEffect(() => {
    // listen to system theme change
    if (themeSetting === 'system') {
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light'
        updateTheme(newTheme)
      }
      mediaQueryList.addEventListener('change', listener)

      // remove listener when component unmounts
      return () => {
        mediaQueryList.removeEventListener('change', listener)
      }
    }
  }, [themeSetting])

  const value = {
    currentTheme,
    themeSetting,
    setThemeSetting: (theme: ThemeSetting) => {
      localStorage.setItem(storageKey, theme)
      setThemeSetting(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
