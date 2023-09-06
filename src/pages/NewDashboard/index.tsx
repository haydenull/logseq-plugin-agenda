import { Analytics } from '@vercel/analytics/react'
import { FloatButton } from 'antd'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { TbComet, TbSettings } from 'react-icons/tb'

import useAgendaTasks from '@/hooks/useAgendaTasks'
import { appAtom } from '@/newModel/app'

import Backlog from './components/Backlog'
import MultipleView from './components/MultipleView'
import ProjectSidebar from './components/ProjectSidebar'
import TimeBox from './components/TimeBox'
import TimeBoxActual from './components/TimeBoxActual'

export type TimeBoxType = 'estimated' | 'actual'
const Dashboard = () => {
  const [timeBoxType, setTimeBoxType] = useState<TimeBoxType>('estimated')
  const [app] = useAtom(appAtom)
  const { refreshTasks } = useAgendaTasks()

  // move to App.tsx
  useEffect(() => {
    refreshTasks()
  }, [])
  return (
    <div className="flex w-screen h-screen bg-gray-100 before:absolute before:pointer-events-none before:h-[180px] before:w-[240px] before:left-1/2 before:top-1/2 before:bg-gradient-conic before:from-sky-200 before:via-blue-200 before:blur-2xl before:content-['']  before:dark:from-sky-900 before:dark:via-[#0141ff] before:dark:opacity-40">
      {/* ========== projects sidebar ========== */}
      <ProjectSidebar className="hidden" />

      {/* ========== Multiple View ========= */}
      <MultipleView className="flex-1" />

      {/* ========== Sidebar ========= */}
      {app.view === 'calendar' ? <Backlog /> : <TimeBox onChangeType={() => setTimeBoxType('actual')} />}

      {/* ========== Toolbar ======== */}
      <div></div>

      {/* ========== Float Button ========= */}
      {/* <FloatButton.Group trigger="hover" type="primary" icon={<TbComet />}>
        <FloatButton tooltip="Backlog" />
        <FloatButton tooltip="Daily Log" />
        <FloatButton tooltip="Weekly Review" />
        <FloatButton tooltip="Analytics" />
        <FloatButton tooltip="Settings" icon={<TbSettings />} />
      </FloatButton.Group> */}
      <Analytics />
    </div>
  )
}

export default Dashboard
