import { Analytics } from '@vercel/analytics/react'
import { Modal, message } from 'antd'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'

import useAgendaTasks from '@/hooks/useAgendaTasks'
import useNewProjects from '@/hooks/useNewProjects'
import { appAtom } from '@/newModel/app'
import { logseqAtom } from '@/newModel/logseq'
import { cn } from '@/util/util'

import Backlog from './components/Backlog'
import MultipleView from './components/MultipleView'
import ProjectSidebar from './components/ProjectSidebar'
import TimeBox from './components/TimeBox'

// import TimeBoxActual from './components/TimeBoxActual'

export type TimeBoxType = 'estimated' | 'actual'
const Dashboard = () => {
  const [timeBoxType, setTimeBoxType] = useState<TimeBoxType>('estimated')
  const app = useAtomValue(appAtom)
  const setLogseq = useSetAtom(logseqAtom)
  const { refreshTasks } = useAgendaTasks()
  const { refreshProjects } = useNewProjects()
  const [connectionErrorModal, setConnectionErrorModal] = useState(false)

  const loadData = async () => {
    refreshTasks().catch(() => {
      setConnectionErrorModal(true)
    })
    refreshProjects()
    // logseq.App.getCurrentGraph().then((res) => {
    //   console.log('getUserConfigs', res)
    // })
  }
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
        "flex w-screen h-screen bg-gray-100 before:absolute before:pointer-events-none before:h-[180px] before:w-[240px] before:left-1/2 before:top-1/2 before:bg-gradient-conic before:from-sky-200 before:via-blue-200 before:blur-2xl before:content-['']  before:dark:from-sky-900 before:dark:via-[#0141ff] before:dark:opacity-40",
        {
          'pt-[30px]': import.meta.env.VITE_MODE === 'plugin',
        },
      )}
    >
      {/* ========== projects sidebar ========== */}
      <ProjectSidebar className="hidden" />

      {/* ========== Multiple View ========= */}
      <MultipleView className="flex-1" />

      {/* ========== Sidebar ========= */}
      {app.view === 'calendar' ? <Backlog /> : <TimeBox onChangeType={() => setTimeBoxType('actual')} />}

      {/* ========== Toolbar ======== */}
      {/* <div></div> */}

      <Analytics />
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
