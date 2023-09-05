import { Tabs, Typography } from 'antd'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import { type ISchedule } from 'tui-calendar'

import CalendarCom from '@/components/Calendar'
import { getInitialSettings } from '@/util/baseInfo'
import { getPageData } from '@/util/logseq'
import { getDailyLogSchedules } from '@/util/schedule'
import type { ILogTag } from '@/util/type'

import Day from './components/Day'
import s from './index.module.less'

const Index = () => {
  const [dailyLogSchedules, setDailyLogSchedules] = useState<ISchedule[]>([])
  const [tagList, setTagList] = useState<Array<ILogTag & { pageId: number }>>()

  useEffect(() => {
    async function init() {
      const { dailyLogTagList } = getInitialSettings()
      const _dailyLogTagList = dailyLogTagList?.filter(Boolean)
      const tagPromiseList = _dailyLogTagList?.map((tag) => getPageData({ originalName: tag.id }))
      const tagPageList = await Promise.all(tagPromiseList || [])
      const tagList = _dailyLogTagList?.map((tag) => ({
        ...tag,
        pageId: tagPageList?.find((page) => page.originalName === tag.id)?.id,
      })) as unknown as Array<ILogTag & { pageId: number }>
      setTagList(tagList)
      const res = await getDailyLogSchedules()
      setDailyLogSchedules(
        res.map((schedule) => {
          // @ts-expect-error raw has refs property
          const tag = tagList?.find((_tag) => schedule?.raw?.refs?.find((ref) => ref.id === _tag.pageId))
          if (!tag) return schedule
          return {
            ...schedule,
            bgColor: tag.bgColor,
            borderColor: tag.borderColor,
            color: tag.textColor,
          }
        }),
      )
    }
    init()
  }, [])

  return (
    <div className={classNames('page-container flex', s.page)}>
      <div className={classNames('flex flex-1 flex-col overflow-hidden p-8')}>
        <Typography.Title className="title-text" level={3}>
          Daily Log
        </Typography.Title>
        <div className="rounded-2xl flex w-full h-full p-6 bg-quaternary">
          <Tabs className="w-full" tabPosition="left">
            <Tabs.TabPane tab="Calendar" key="calendar">
              <CalendarCom schedules={dailyLogSchedules} isProjectCalendar={false} isDailyLogCalendar />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Day" key="day">
              <Day schedules={dailyLogSchedules} tagList={tagList} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Week" key="week">
              <Day schedules={dailyLogSchedules} tagList={tagList} type="week" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Month" key="month">
              <Day schedules={dailyLogSchedules} tagList={tagList} type="month" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Quarter" key="quarter">
              <Day schedules={dailyLogSchedules} tagList={tagList} type="quarter" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Year" key="year">
              <Day schedules={dailyLogSchedules} tagList={tagList} type="year" />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Index
