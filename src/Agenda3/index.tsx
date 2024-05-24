// import { Analytics } from '@vercel/analytics/react'
import { Modal, message } from 'antd'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'

import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import usePages from '@/Agenda3/hooks/usePages'
import { appAtom } from '@/Agenda3/models/app'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { cn } from '@/util/util'

import MultipleView from './components/MainArea'
import Sidebar from './components/Sidebar'
import useSettings from './hooks/useSettings'
import { init as initI18n } from './locales/i18n'

// import TimeBoxActual from './components/TimeBoxActual'

initI18n()

export type TimeBoxType = 'estimated' | 'actual'
const Dashboard = () => {
  const app = useAtomValue(appAtom)
  // 需要初始化 settings
  const { initializeSettings } = useSettings()
  const setLogseq = useSetAtom(logseqAtom)
  const { refreshEntities } = useAgendaEntities()
  const { refreshPages } = usePages()
  const [connectionErrorModal, setConnectionErrorModal] = useState(false)

  const loadData = useCallback(() => {
    refreshEntities().catch((error) => {
      console.error('retrieve tasks failed', error)
      if (import.meta.env.VITE_MODE === 'web') {
        return setConnectionErrorModal(true)
      }
      message.error('retrieve tasks failed')
    })
    refreshPages()
    // logseq.App.getCurrentGraph().then((res) => {
    //   console.log('getUserConfigs', res)
    // })
  }, [refreshEntities])
  // get tasks and projects
  useEffect(() => {
    const handleWindowFocus = () => {
      // 在浏览器获得焦点时刷新数据
      loadData()
    }
    // 添加窗口焦点事件监听器
    window.addEventListener('focus', handleWindowFocus)
    // 在页面初次加载时刷新数据
    loadData()
    // 在组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [loadData])
  // initialize settings
  useEffect(() => {
    initializeSettings()
  }, [])
  // set logseq app and user info
  useEffect(() => {
    logseq.App.getCurrentGraph().then((graph) => {
      if (!graph) return message.error('Unknown Graph')
      setLogseq({ currentGraph: graph })
    })
  }, [])
  return (
    <div
      className={cn(
        `flex h-screen w-screen bg-gray-100 before:pointer-events-none before:absolute before:h-[180px] before:w-[240px]
        before:bg-gradient-conic before:from-sky-200 before:via-blue-200 before:blur-2xl before:transition-all
        before:content-[''] before:dark:from-sky-900 before:dark:via-[#0141ff] before:dark:opacity-40`,
        {
          'pt-[30px]': import.meta.env.VITE_MODE === 'plugin',
        },
        app.view === 'calendar' ? 'before:left-1/4 before:top-2/3' : 'before:left-1/2 before:top-1/2',
      )}
    >
      {/* ========== projects sidebar ========== */}
      {/* <ProjectSidebar className="hidden" /> */}

      {/* ========== Multiple View ========= */}
      <MultipleView className="flex-1" />

      {/* ========== Sidebar ========= */}
      <Sidebar />

      {/* ========== Toolbar ======== */}
      {/* <div></div> */}

      {/* <Analytics /> */}
      <Modal
        open={connectionErrorModal}
        title="Connection Error"
        onCancel={() => setConnectionErrorModal(false)}
        okText="Refresh"
        onOk={() => window.location.reload()}
      >
        <div>Please check the logseq api configuration and refresh the page to try again.</div>
        <a href="https://haydenut.notion.site/Agenda3-ef115e277c864de3b2679d6bda0e6376?pvs=4">
          Reference Documents: https://haydenut.notion.site/Agenda3-ef115e277c864de3b2679d6bda0e6376?pvs=4
        </a>
      </Modal>
    </div>
  )
}

export default Dashboard
