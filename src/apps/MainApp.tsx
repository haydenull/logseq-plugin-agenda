import Sider from '@/components/Sider'
import { MENUS } from '@/constants/elements'
import { subscriptionSchedulesAtom } from '@/model/schedule'
import ProjectDetail from '@/pages/ProjectDetail'
import { getInitialSettings } from '@/util/baseInfo'
import { ANTD_THEME_CONFIG, DEFAULT_SETTINGS } from '@/util/constants'
import { getSubCalendarSchedules } from '@/util/subscription'
import { ConfigProvider } from 'antd'
import { useAtom } from 'jotai'
import React, { useEffect } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import useTheme from '../hooks/useTheme'
import { fullEventsAtom, journalEventsAtom, projectEventsAtom } from '../model/events'
import { getInternalEvents } from '../util/events'

const MainApp: React.FC<{
  defaultRoute?: string
}> = ({ defaultRoute }) => {
  // TODO: 使用 only-write 减少重新渲染
  const [, setSubscriptionSchedules] = useAtom(subscriptionSchedulesAtom)

  const [, setFullEvents] = useAtom(fullEventsAtom)
  const [, setJournalEvents] = useAtom(journalEventsAtom)
  const [, setProjectEvents] = useAtom(projectEventsAtom)

  const theme = useTheme() || 'green'

  const { homePage = DEFAULT_SETTINGS.homePage, logKey } = getInitialSettings()
  const homePageElement = MENUS.find((item) => item.value === homePage)?.element
  const menus = logKey?.enabled ? MENUS : MENUS.filter((item) => item.value !== 'dailyLog')

  useEffect(() => {
    async function fetchSchedules() {
      const res = await getInternalEvents()
      if (res) {
        const { fullEvents, journalEvents, projectEventsMap } = res
        setFullEvents(fullEvents)
        setJournalEvents(journalEvents)
        setProjectEvents(projectEventsMap)
      }

      const { subscriptionList } = getInitialSettings()
      setSubscriptionSchedules(await getSubCalendarSchedules(subscriptionList))
    }
    fetchSchedules()
  }, [])

  return (
    <ConfigProvider theme={ANTD_THEME_CONFIG[theme]}>
      <main className="w-screen h-screen flex" prefix="custom">
        <MemoryRouter>
          <Sider defaultRoute={defaultRoute} menus={menus} />
          <Routes>
            <Route path="/" element={homePageElement} />
            {menus.map((item) => (
              <Route path={item.path} element={item.element} key={item.value} />
            ))}
            <Route path="/project/:projectId" element={<ProjectDetail />} />
          </Routes>
        </MemoryRouter>
      </main>
    </ConfigProvider>
  )
}

export default MainApp
