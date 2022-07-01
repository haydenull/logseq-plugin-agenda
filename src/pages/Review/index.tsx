import classNames from 'classnames'
import { useAtom } from 'jotai'
import s from './index.module.less'
import SearchForm, { IReviewSearchForm } from './components/SearchForm'
import { categorizeTask } from '@/util/schedule'
import { fullEventsAtom, journalEventsAtom, projectEventsAtom } from '@/model/events'
import { IEvent } from '@/util/events'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import { Table } from 'antd'
import { IPomodoroInfo } from '@/helper/pomodoro'
import { extractDays } from '@/util/util'


const filterEvents = (rawEvents: IEvent[], filter: IReviewSearchForm) => {
  let events = rawEvents
  if (filter.project?.length) {
    const hasJournal = filter.project?.some(project => project === 'journal')
    events = events.filter(event => {
      return (hasJournal && event.addOns.isJournal) || filter.project?.some(project => project === event.page?.['original-name'])
    })
  }

  if (filter.status?.length) {
    const categories = categorizeTask(events)
    events = filter.status.reduce((acc, cur) => {
      return acc.concat(categories?.[cur] || [])
    }, [])
  }

  if (filter.timeframe?.length) {
    const [ rangeStart, rangeEnd ] = filter.timeframe
    events = events.filter(event => {
      if (!event.rawTime) return false
      const start = dayjs(event.addOns.start)
      const end = event.addOns.end ? dayjs(event.addOns.end) : start
      return start.isSameOrBefore(rangeEnd, 'day') && end.isSameOrAfter(rangeStart, 'day')
    })
  }

  return events.sort((a, b) => dayjs(a.addOns.start).diff(dayjs(b.addOns.start)))
}
const genPomoData = (events: IEvent[], timeframe?: [Dayjs, Dayjs]) => {
  const pomos = events.map(event => event.addOns.pomodoros).filter(Boolean)?.flat()

  const pomoDayMap = new Map<number, IPomodoroInfo[]>()
  pomos.forEach(pomo => {
    if (!pomo) return
    const key = dayjs(pomo.start).startOf('day').valueOf()
    if (!pomoDayMap.has(key)) pomoDayMap.set(key, [])
    pomoDayMap.get(key)?.push(pomo)
  })

  const minDay = Math.min(...Array.from(pomoDayMap.keys()))
  const maxDay = Math.max(...Array.from(pomoDayMap.keys()))
  const [ start, end ] = timeframe || [dayjs(minDay), dayjs(maxDay)]
  const days = extractDays(start, end)

  return days.map(day => {
    const timestamp = day.valueOf()
    return {
      date: timestamp,
      pomodoros: pomoDayMap.get(timestamp) || [],
    }
  })
}

const index = () => {
  // const [internalSchedules] = useAtom(fullCalendarSchedulesAtom)
  // const [subscriptionSchedules] = useAtom(subscriptionSchedulesAtom)
  // const [customCalendarSchedules, setCustomCalendarSchedules] = useState<any[]>([])
  const [fullEvents] = useAtom(fullEventsAtom)
  const [journalEvents] = useAtom(journalEventsAtom)
  const [projectEvents] = useAtom(projectEventsAtom)

  const [filter, setFilter] = useState<IReviewSearchForm>({})
  const events = filterEvents(fullEvents.tasks.withTime, filter)

  const pomodoros = genPomoData(events, filter?.timeframe)

  const onSearch = (values: IReviewSearchForm) => {
    console.log('[faiz:] === values', values)
    setFilter(values)
  }

  // useEffect(() => {
  //   getCustomCalendarSchedules()
  //     .then(res => {
  //       setCustomCalendarSchedules(res)
  //     })
  // }, [])

  return (
    <div className="page-container flex">
      <div className={classNames('flex flex-1 flex-col overflow-hidden p-8')}>
        <h1 className="title-text">Review</h1>
        <div className="bg-quaternary flex flex-col flex-1 rounded-2xl box-border p-6 overflow-auto">
          <SearchForm onSearch={onSearch} />
          {/* <CalendarCom schedules={[...subscriptionSchedules, ...internalSchedules, ...customCalendarSchedules]} isProjectCalendar={false} /> */}
          <Table
            dataSource={events}
            columns={[
              {
                title: 'Title',
                dataIndex: ['addOns', 'showTitle'],
                width: '240px',
                ellipsis: true,
              },
              {
                title: 'Project',
                dataIndex: ['page', 'original-name'],
                render: (value, record) => record.addOns.isJournal ? 'Journal' : value,
              },
              {
                title: 'Date',
                dataIndex: ['addOns', 'start'],
                width: '240px',
                render: (text, record) => `${dayjs(text).format('YYYY-MM-DD')} - ${dayjs(record.addOns.end).format('YYYY-MM-DD')}`
              },
              {
                title: 'Status',
                dataIndex: ['addOns', 'status'],
              },
              {
                title: 'Pomodoro Amount',
                dataIndex: ['addOns', 'pomodoros'],
                render: (value) => value?.length,
              },
              {
                title: 'Pomodoro Length',
                dataIndex: ['addOns', 'pomodoros'],
                render: (value) => `${Math.ceil(value?.reduce((acc, cur) => acc + cur.length, 0) / 60)} min` ,
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export default index
