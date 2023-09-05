import { Button, message, Table, Typography } from 'antd'
import classNames from 'classnames'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtom } from 'jotai'
import { useState } from 'react'

import { type IPomodoroInfo } from '@/helper/pomodoro'
import { fullEventsAtom } from '@/model/events'
import { getEventPomodoroLength, type IEvent } from '@/util/events'
import { navToBlock, navToPage } from '@/util/logseq'
import { categorizeTask } from '@/util/schedule'
import { copyToClipboard, extractDays } from '@/util/util'

import MixLineBar from './components/MixLineBar'
import SearchForm, { type IReviewSearchForm } from './components/SearchForm'
import TreeMap, { type IData } from './components/TreeMap'

const filterEvents = (rawEvents: IEvent[], filter: IReviewSearchForm) => {
  let events = rawEvents
  if (filter.project?.length) {
    const hasJournal = filter.project?.some((project) => project === 'journal')
    events = events.filter((event) => {
      return (
        (hasJournal && event.addOns.isJournal) || filter.project?.some((project) => project === event.addOns.project)
      )
    })
  }

  if (filter.status?.length) {
    const categories = categorizeTask(events)
    events = filter.status.reduce((acc, cur) => {
      return acc.concat(categories?.[cur] || [])
    }, [])
  }

  if (filter.timeframe?.length) {
    const [rangeStart, rangeEnd] = filter.timeframe
    events = events.filter((event) => {
      if (!event.rawTime) return false
      const start = dayjs(event.addOns.start)
      const end = event.addOns.end ? dayjs(event.addOns.end) : start
      return start.isSameOrBefore(rangeEnd, 'day') && end.isSameOrAfter(rangeStart, 'day')
    })
  }

  return events.sort((a, b) => dayjs(a.addOns.start).diff(dayjs(b.addOns.start)))
}
const genPomoData = (events: IEvent[], timeframe?: [Dayjs, Dayjs]) => {
  const pomos = events
    .map((event) => event.addOns.pomodoros)
    .filter(Boolean)
    ?.flat()

  const pomoDayMap = new Map<number, IPomodoroInfo[]>()
  pomos?.forEach((pomo) => {
    if (!pomo) return
    const key = dayjs(pomo.start).startOf('day').valueOf()
    if (!pomoDayMap.has(key)) pomoDayMap.set(key, [])
    pomoDayMap.get(key)?.push(pomo)
  })

  const minDay = Math.min(...Array.from(pomoDayMap.keys()))
  const maxDay = Math.max(...Array.from(pomoDayMap.keys()))
  const [start, end] = timeframe || [dayjs(minDay), dayjs(maxDay)]
  const days = extractDays(start, end)

  return days.map((day) => {
    const timestamp = day?.startOf('day').valueOf()
    return {
      date: timestamp,
      pomodoros: pomoDayMap.get(timestamp) || [],
    }
  })
}
const genPomoByProjectData = (events: IEvent[]) => {
  const eventProjectMap = new Map<string, IEvent[]>()
  events.forEach((event) => {
    const key = event.addOns.project
    if (!eventProjectMap.has(key)) eventProjectMap.set(key, [])
    eventProjectMap.get(key)?.push(event)
  })

  const data: { name: string; value: number; children: IData[] }[] = []
  eventProjectMap.forEach((_events, key) => {
    data.push({
      name: key,
      value: Math.ceil(_events.reduce((acc, event) => acc + getEventPomodoroLength(event), 0) / 60),
      children: _events.map((event) => ({
        name: event.addOns.showTitle,
        value: Math.ceil(getEventPomodoroLength(event) / 60),
      })),
    })
  })
  return data
}
const getEventDateValue = (event: IEvent) => (event.rawTime ? dayjs(event.addOns.start).valueOf() : 0)

const Index = () => {
  // const [internalSchedules] = useAtom(fullCalendarSchedulesAtom)
  // const [subscriptionSchedules] = useAtom(subscriptionSchedulesAtom)
  // const [customCalendarSchedules, setCustomCalendarSchedules] = useState<any[]>([])
  const [fullEvents] = useAtom(fullEventsAtom)

  const [filter, setFilter] = useState<IReviewSearchForm>({ timeframe: [dayjs().weekday(0), dayjs().weekday(6)] })
  const events = filterEvents(fullEvents.tasks.withTime.concat(fullEvents.tasks.noTime), filter)

  const pomodoros = genPomoData(events, filter?.timeframe)
  const pomodoroByProject = genPomoByProjectData(events)

  const onSearch = (values: IReviewSearchForm) => {
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
        <Typography.Title className="title-text" level={3}>
          Review
        </Typography.Title>
        <div className="bg-quaternary flex-1 rounded-2xl box-border p-6 overflow-auto">
          <SearchForm onSearch={onSearch} initialValues={filter} />
          <Table<IEvent>
            dataSource={events}
            title={() => (
              <div className="flex justify-end">
                <Button
                  size="small"
                  type="link"
                  style={{ color: 'var(--ls-tertiary-background-color)' }}
                  onClick={() => {
                    copyToClipboard(events.map((event) => event.addOns.showTitle).join('\n'))
                    message.success(`🥳 ${events.length} pieces of data have been copied to clipboard!`)
                  }}
                >
                  Export
                </Button>
              </div>
            )}
            columns={[
              {
                title: 'Title',
                dataIndex: ['addOns', 'showTitle'],
                ellipsis: true,
                render: (title, record) => <a onClick={() => navToBlock(record)}>{title}</a>,
              },
              {
                title: 'Project',
                dataIndex: ['addOns', 'project'],
                ellipsis: true,
                render: (title, record) => <a onClick={() => navToPage(record)}>{title}</a>,
              },
              {
                title: 'Date',
                dataIndex: ['addOns', 'start'],
                width: '240px',
                render: (text, record) =>
                  record.rawTime
                    ? `${dayjs(text).format('YYYY-MM-DD')} - ${dayjs(record.addOns.end).format('YYYY-MM-DD')}`
                    : '-',
                defaultSortOrder: 'descend',
                sorter: (a, b) => getEventDateValue(a) - getEventDateValue(b),
                filters: [
                  { text: 'Scheduled', value: 'scheduled' },
                  { text: 'No Schedule', value: 'noSchedule' },
                ],
                onFilter: (value, record) => {
                  if (value === 'noSchedule') return !record.rawTime
                  if (value === 'scheduled') return Boolean(record.rawTime)
                  return true
                },
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
                render: (value) => `${Math.ceil(value?.reduce((acc, cur) => acc + cur.length, 0) / 60)} min`,
              },
            ]}
          />

          <MixLineBar data={pomodoros} />
          <TreeMap data={pomodoroByProject} />
        </div>
      </div>
    </div>
  )
}

export default Index
