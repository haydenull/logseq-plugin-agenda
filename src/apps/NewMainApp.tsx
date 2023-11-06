import { StyleProvider } from '@ant-design/cssinjs'
import { CloseOutlined } from '@ant-design/icons'
import { Button, ConfigProvider } from 'antd'

import Dashboard from '@/pages/NewDashboard'
import { NEW_ANTD_THEME_CONFIG } from '@/util/constants'
import { cn } from '@/util/util'

const theme = 'green'
const NewMainApp = () => {
  return (
    <ConfigProvider theme={NEW_ANTD_THEME_CONFIG[theme]}>
      <StyleProvider hashPriority="high">
        <main className="w-screen h-screen flex flex-col">
          <Dashboard />
        </main>
      </StyleProvider>
    </ConfigProvider>
  )
}

export default NewMainApp
