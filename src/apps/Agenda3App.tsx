import { StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider } from 'antd'

import Dashboard from '@/Agenda3'
import { ThemeProvider, useTheme } from '@/Agenda3/components/ThemeProvider'
import { NEW_ANTD_THEME_CONFIG } from '@/util/constants'

const Agenda3 = () => {
  return (
    <ThemeProvider defaultThemeSetting="system">
      <MainApp />
    </ThemeProvider>
  )
}

function MainApp() {
  const { currentTheme: theme } = useTheme()
  return (
    <ConfigProvider theme={NEW_ANTD_THEME_CONFIG[theme]}>
      <StyleProvider hashPriority="high">
        <main className="flex h-screen w-screen flex-col">
          <Dashboard />
        </main>
      </StyleProvider>
    </ConfigProvider>
  )
}

export default Agenda3
