import React, { useEffect, useState } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Sider from '@/components/Sider'
import { MENUS } from '@/constants/elements'
import { useAtom } from 'jotai'
import { projectSchedulesAtom, subscriptionSchedulesAtom } from '@/model/schedule'
import { getSchedules, categorizeTasks } from '@/util/schedule'
import { getInitalSettings } from '@/util/baseInfo'
import { getSubCalendarSchedules } from '@/util/subscription'
import { DEFAULT_SETTINGS } from '@/util/constants'
import ProjectDetail from '@/pages/ProjectDetail'
import SidebarTask from './components/SidebarTask'
import { fullEventsAtom, journalEventsAtom, projectEventsAtom, todayTasksAtom } from '@/model/events'
import { getInternalEvents } from './util/events'

const App: React.FC<{
  containerId: string
}> = ({ containerId }) => {

  // TODO: 使用 only-write 减少重新渲染
  const [, setProjectSchedules] = useAtom(projectSchedulesAtom)
  // const [, setSubscriptionSchedules] = useAtom(subscriptionSchedulesAtom)

  const [todayTasks] = useAtom(todayTasksAtom)
  const { overdueTasks, allDayTasks, timeTasks } = categorizeTasks(todayTasks)

  const [, setFullEvents] = useAtom(fullEventsAtom)
  const [, setJournalEvents] = useAtom(journalEventsAtom)
  const [, setProjectEvents] = useAtom(projectEventsAtom)

  useEffect(() => {
    async function fetchSchedules() {
      const res = await getInternalEvents()
      if (res) {
        const { fullEvents, journalEvents, projectEventsMap } = res
        setFullEvents(fullEvents)
        setJournalEvents(journalEvents)
        setProjectEvents(projectEventsMap)
      }

      // setProjectSchedules(await getSchedules())
      // const { subscriptionList } = getInitalSettings()
      // setSubscriptionSchedules(await getSubCalendarSchedules(subscriptionList))
    }
    fetchSchedules()
    logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
      if (txData?.some(item => item?.[1] === 'marker') && parent.document.querySelector('#' + containerId)) {
        fetchSchedules()
      }
    })
  }, [])

  return (
    <main>
      {
        overdueTasks.length > 0 && (
          <div style={{ margin: '8px 0' }}>
            {/* <span>Overdue</span> */}
            {
              overdueTasks.map(task => (
                <SidebarTask key={task.id} task={task} type="overdue" />
              ))
            }
          </div>
        )
      }
      {
        allDayTasks.length > 0 && (
          <div>
            {/* <span>All Day</span> */}
            {
              allDayTasks.map(task => (
                <SidebarTask key={task.id} task={task} type="allDay" />
              ))
            }
          </div>
        )
      }
      {
        timeTasks.length > 0 && (
          <div>
            {/* <span>Time</span> */}
            {
              timeTasks.map(task => (
                <SidebarTask key={task.id} task={task} type="time" />
              ))
            }
          </div>
        )
      }
    </main>
  )
}

export default App
