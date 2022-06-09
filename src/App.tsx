import React, { useEffect, useState } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Sider from '@/components/Sider'
import { MENUS } from '@/constants/elements'
import { useAtom } from 'jotai'
import { projectSchedulesAtom, subscriptionSchedulesAtom } from '@/model/schedule'
import { getInitalSettings } from '@/util/baseInfo'
import { getSubCalendarSchedules } from '@/util/subscription'
import { DEFAULT_SETTINGS } from '@/util/constants'
import ProjectDetail from '@/pages/ProjectDetail'
import { fullEventsAtom, journalEventsAtom, projectEventsAtom } from './model/events'
import { getInternalEvents } from './util/events'

const App: React.FC<{
  defaultRoute?: string
}> = ({ defaultRoute }) => {

  // TODO: 使用 only-write 减少重新渲染
  const [, setProjectSchedules] = useAtom(projectSchedulesAtom)
  const [, setSubscriptionSchedules] = useAtom(subscriptionSchedulesAtom)

  const [, setFullEvents] = useAtom(fullEventsAtom)
  const [, setJournalEvents] = useAtom(journalEventsAtom)
  const [, setProjectEvents] = useAtom(projectEventsAtom)

  const { homePage = DEFAULT_SETTINGS.homePage } = getInitalSettings()
  const homePageElement = MENUS.find(item => item.value === homePage)?.element

  useEffect(() => {
    async function fetchSchedules() {
      console.log('======xxxxxx')
      const res = await getInternalEvents()
      console.log('[faiz:] === res', res)
      if (res) {
        const { fullEvents, journalEvents, projectEventsMap } = res
        setFullEvents(fullEvents)
        setJournalEvents(journalEvents)
        setProjectEvents(projectEventsMap)
      }

      const { subscriptionList } = getInitalSettings()
      setSubscriptionSchedules(await getSubCalendarSchedules(subscriptionList))
    }
    fetchSchedules()
  }, [])

  return (
    <main className="w-screen h-screen flex" prefix="custom">
      <MemoryRouter>
        <Sider defaultRoute={defaultRoute} />
        <Routes>
          <Route path="/" element={homePageElement} />
          {
            MENUS.map(item => (
              <Route path={item.path} element={item.element} key={item.value} />
            ))
          }
          <Route path="/project/:projectId" element={<ProjectDetail />} />
        </Routes>
      </MemoryRouter>
    </main>
  )
}

export default App
