import React, { useEffect, useState } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Sider from '@/components/Sider'
import Dashboard from '@/pages/Dashboard'
import { MENUS } from '@/constants/elements'
import { listenEsc } from '@/util/util'
import { useAtom } from 'jotai'
import { projectSchedulesAtom, subscriptionSchedulesAtom } from '@/model/schedule'
import { getSchedules } from '@/util/schedule'
import { getInitalSettings } from '@/util/baseInfo'
import { getSubCalendarSchedules } from '@/util/subscription'

const App: React.FC<{}> = () => {

  const [projectSchedules, setProjectSchedules] = useAtom(projectSchedulesAtom)
  const [subscriptionSchedules, setSubscriptionSchedules] = useAtom(subscriptionSchedulesAtom)

  useEffect(() => {
    async function fetchSchedules() {
      setProjectSchedules(await getSchedules())
      const { subscriptionList } = await getInitalSettings()
      setSubscriptionSchedules(await getSubCalendarSchedules(subscriptionList))
    }
    fetchSchedules()
  }, [])

  useEffect(() => {
    const callback = () => logseq.hideMainUI()
    listenEsc(callback)
    return () => {
      document.removeEventListener('keyup', callback)
    }
  }, [])

  return (
    <main className="w-screen h-screen flex">
      <MemoryRouter>
        <Sider />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {
            MENUS.map(item => (
              <Route path={item.path} element={item.element} key={item.value} />
            ))
          }
        </Routes>
      </MemoryRouter>
    </main>
  )
}

export default App
