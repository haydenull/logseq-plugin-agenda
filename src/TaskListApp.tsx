import React, { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { projectSchedulesAtom, subscriptionSchedulesAtom, todaySubscriptionSchedulesAtom } from '@/model/schedule'
import { categorizeSubscriptions, categorizeTasks } from '@/util/schedule'
import SidebarTask from './components/SidebarTask'
import { fullEventsAtom, journalEventsAtom, projectEventsAtom, todayTasksAtom } from '@/model/events'
import { getInternalEvents } from './util/events'
import SidebarSubscription from './components/SidebarSubscription'

const App: React.FC<{
  containerId: string
}> = ({ containerId }) => {

  // TODO: 使用 only-write 减少重新渲染
  const [, setProjectSchedules] = useAtom(projectSchedulesAtom)

  const [todaySubscriptions] = useAtom(todaySubscriptionSchedulesAtom)
  const { allDaySubscriptions, timeSubscriptions } = categorizeSubscriptions(todaySubscriptions)
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
        overdueTasks?.length === 0 && allDayTasks?.length === 0 && timeTasks?.length === 0 && (
          <div>Empty task list</div>
        )
      }
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
        (allDayTasks.length > 0 || allDaySubscriptions.length > 0) && (
          <div>
            {/* <span>All Day</span> */}
            {
              allDaySubscriptions.map(subscription => (
                <SidebarSubscription key={subscription.id} subscription={subscription} type="allDay" />
              ))
            }
            {
              allDayTasks.map(task => (
                <SidebarTask key={task.id} task={task} type="allDay" />
              ))
            }
          </div>
        )
      }
      {
        (timeTasks.length > 0 || timeSubscriptions.length > 0) && (
          <div>
            {/* <span>Time</span> */}
            {
              timeSubscriptions.map(subscription => (
                <SidebarSubscription key={subscription.id} subscription={subscription} type="time" />
              ))
            }
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
