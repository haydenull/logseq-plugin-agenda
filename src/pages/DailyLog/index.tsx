import { useEffect, useState } from 'react'
import classNames from 'classnames'
import CalendarCom from '@/components/Calendar'
import { getDailyLogSchedules } from '@/util/schedule'
import { Tabs } from 'antd'
import Day from './components/Day'
import s from './index.module.less'
import { ILogTag } from '@/util/type'
import { getInitalSettings } from '@/util/baseInfo'
import { getPageData } from '@/util/logseq'

const index = () => {
  const [dailyLogSchedules, setDailyLogSchedules] = useState<any[]>([])
  const [tagList, setTagList] = useState<Array<ILogTag & { pageId: number }>>()

  useEffect(() => {
    async function init() {
      const { dailyLogTagList } = getInitalSettings()
      const tagPromiseList = dailyLogTagList?.map(tag => getPageData({ originalName: tag.id }))
      const tagPageList = await Promise.all(tagPromiseList || [])
      const tagList = dailyLogTagList?.map(tag => ({ ...tag, pageId: tagPageList?.find(page => page.originalName === tag.id)?.id })) as unknown as Array<ILogTag & { pageId: number }>
      setTagList(tagList)
      const res  = await getDailyLogSchedules()
      setDailyLogSchedules(res.map(schedule => {
        const tag = tagList?.find(_tag => (schedule?.raw as any).refs?.find(ref => ref.id === _tag.pageId))
        if (!tag) return schedule
        return {
          ...schedule,
          bgColor: tag.bgColor,
          borderColor: tag.borderColor,
          color: tag.textColor,
        }
      }))
    }
    init()
  }, [])

  return (
    <div className={classNames('page-container flex', s.page)}>
      <div className={classNames('flex flex-1 flex-col overflow-hidden p-8')}>

        <h1 className="title-text">Daily Log</h1>
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

export default index
