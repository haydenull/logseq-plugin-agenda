import clsx from 'clsx'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'
import { MdAddTask } from 'react-icons/md'
import { TbActivity } from 'react-icons/tb'

import SidebarSubscription from '@/components/SidebarSubscription'
import SidebarTask from '@/components/SidebarTask'
import { renderModalApp } from '@/main'
import { fullEventsAtom, journalEventsAtom, projectEventsAtom } from '@/model/events'
import { subscriptionSchedulesAtom } from '@/model/schedule'
import { getInitialSettings } from '@/util/baseInfo'
import { getInternalEvents, getTasksInTimeRange } from '@/util/events'
import { categorizeSubscriptions, categorizeTasks } from '@/util/schedule'
import { getSubCalendarSchedules, getSubscriptionsInTimeRange } from '@/util/subscription'
import { genDaysOfWeek } from '@/util/util'

const App: React.FC<{
  containerId: string
}> = ({ containerId }) => {
  const { t } = useTranslation()
  const [, setJournalEvents] = useAtom(journalEventsAtom)
  const [, setProjectEvents] = useAtom(projectEventsAtom)

  // calendar
  const [daysOfWeek, setDaysOfWeek] = useState<Dayjs[]>([])
  const [activeDay, setActiveDay] = useState<Dayjs>(dayjs())

  // subscriptions
  const [fullSubscriptions, setSubscriptionSchedules] = useAtom(subscriptionSchedulesAtom)
  const weekSubscriptionsMap = getSubscriptionsInTimeRange(fullSubscriptions, daysOfWeek)
  const activeDaySubscriptions = weekSubscriptionsMap.get(activeDay.format('YYYY-MM-DD')) ?? []
  const { allDaySubscriptions, timeSubscriptions } = categorizeSubscriptions(activeDaySubscriptions)

  // tasks
  const [fullTasks, setFullEvents] = useAtom(fullEventsAtom)
  const weekTasksMap = getTasksInTimeRange(fullTasks?.tasks?.withTime, daysOfWeek)
  const activeDayTasks = weekTasksMap.get(activeDay.format('YYYY-MM-DD')) ?? []
  const { overdueTasks, allDayTasks, timeTasks } = categorizeTasks(activeDayTasks)

  // week day with dots
  const weekDaysWithDots = Object.fromEntries(
    daysOfWeek.map((day) => {
      const dayString = day.format('YYYY-MM-DD')
      const subscriptions = weekSubscriptionsMap.get(dayString) ?? []
      const tasks = weekTasksMap.get(dayString) ?? []
      return [dayString, subscriptions.length > 0 || tasks.length > 0]
    }),
  )

  const onClickCalendarNumber = (day: Dayjs) => {
    setActiveDay(day)
  }
  const onClickCalendarArrow = (direction: 'back' | 'forward') => {
    const oneDay =
      direction === 'back' ? daysOfWeek[0]?.add(-1, 'day') : daysOfWeek[daysOfWeek.length - 1].add(1, 'day')
    const { weekStartDay } = getInitialSettings()
    const days = genDaysOfWeek(weekStartDay, oneDay)
    setDaysOfWeek(days)
    setActiveDay((_old) => days.find((day) => day.day() === _old.day()) ?? days[0])
  }

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
    logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
      if (txData?.some((item) => item?.[1] === 'marker') && parent.document.querySelector('#' + containerId)) {
        fetchSchedules()
      }
    })
  }, [])

  useEffect(() => {
    // generate current week days
    const { weekStartDay } = getInitialSettings()
    const days = genDaysOfWeek(weekStartDay)
    setDaysOfWeek(days)
  }, [])

  return (
    <main>
      {/* ========= toolbar start ========= */}
      <div className="flex items-center">
        <a
          className="button items-center"
          style={{ display: 'flex' }}
          title={t('Add Daily Log')}
          href="javascript:void(0);"
          onClick={() => {
            renderModalApp({ type: 'addDailyLog' })
            logseq.showMainUI()
          }}
        >
          <TbActivity />
        </a>
        <a
          className="button items-center"
          style={{ display: 'flex' }}
          title={t('Create Task')}
          href="javascript:void(0);"
          onClick={() => {
            renderModalApp({ type: 'createTask' })
            logseq.showMainUI()
          }}
        >
          <MdAddTask />
        </a>
      </div>
      {/* ========= toolbar end ========= */}

      {/* ========= calendar start ========= */}
      <div className="flex items-center justify-between agenda-sidebar-calendar">
        <div
          className="agenda-sidebar-calendar__number flex items-center justify-center"
          onClick={() => onClickCalendarArrow('back')}
        >
          <IoIosArrowBack />
        </div>
        {daysOfWeek.map((day) => {
          const isActiveDay = day.isSame(activeDay, 'day')
          const today = dayjs()
          const isToday = day.isSame(today, 'day')
          return (
            <div
              className="flex flex-col items-center"
              key={day.format('YYYY-MM-DD')}
              onClick={() => onClickCalendarNumber(day)}
            >
              <span
                className={clsx({
                  'agenda-sidebar-calendar__week-day--today': isToday,
                })}
              >
                {day.format('dd')?.charAt(0)}
              </span>
              <div
                className={clsx('agenda-sidebar-calendar__number flex items-center justify-center', {
                  'bg-indigo-600 agenda-sidebar-calendar__number--active': isActiveDay,
                  'agenda-sidebar-calendar__number--dot': weekDaysWithDots[day.format('YYYY-MM-DD')],
                  'agenda-sidebar-calendar__number--today': isToday,
                })}
                style={{ opacity: day.isSameOrAfter(today, 'day') || isActiveDay ? 0.9 : 0.4 }}
              >
                {day.format('DD')}
              </div>
            </div>
          )
        })}
        <div
          className="agenda-sidebar-calendar__number flex items-center justify-center"
          onClick={() => onClickCalendarArrow('forward')}
        >
          <IoIosArrowForward />
        </div>
      </div>
      {/* ========= calendar end ========= */}

      {overdueTasks?.length === 0 &&
      allDayTasks?.length === 0 &&
      timeTasks?.length === 0 &&
      allDaySubscriptions?.length === 0 &&
      timeSubscriptions?.length === 0 ? (
        <div className="flex justify-center">No tasks found, enjoy your day</div>
      ) : null}
      {/* overdue tasks */}
      {overdueTasks.length > 0 && (
        <div style={{ margin: '8px 0' }}>
          {/* <span>Overdue</span> */}
          {overdueTasks.map((task) => (
            <SidebarTask key={task.id} task={task} type="overdue" />
          ))}
        </div>
      )}
      {/* all day tasks */}
      {(allDayTasks.length > 0 || allDaySubscriptions.length > 0) && (
        <div>
          {/* <span>All Day</span> */}
          {allDaySubscriptions.map((subscription) => (
            <SidebarSubscription key={subscription.id} subscription={subscription} type="allDay" />
          ))}
          {allDayTasks.map((task) => (
            <SidebarTask key={task.id} task={task} type="allDay" />
          ))}
        </div>
      )}
      {/* time tasks */}
      {(timeTasks.length > 0 || timeSubscriptions.length > 0) && (
        <div>
          {/* <span>Time</span> */}
          {timeSubscriptions.map((subscription) => (
            <SidebarSubscription key={subscription.id} subscription={subscription} type="time" />
          ))}
          {timeTasks.map((task) => (
            <SidebarTask key={task.id} task={task} type="time" />
          ))}
        </div>
      )}
    </main>
  )
}

export default App
