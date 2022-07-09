// import React, { useState } from 'react'
import { extractBlockContentToText, getJouralPageBlocksTree, extractBlockContentToHtml } from '@/util/logseq'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'
import { DatePicker } from 'antd'
import { format } from 'date-fns'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { Chrono, TimelineItem } from 'react-chrono'

const items = [
  {
    title: "May 1940",
    cardTitle: "Dunkirk",
    url: "http://www.history.com",
    cardSubtitle:"Men of the British Expeditionary Force (BEF) wade out to..",
    cardDetailedText: "Men of the British Expeditionary Force (BEF) wade out to..",
  },
  {
    title: "May 1940",
    cardTitle: "Dunkirk",
    url: "http://www.history.com",
    cardSubtitle:"Men of the British Expeditionary Force (BEF) wade out to..",
    cardDetailedText: "Men of the British Expeditionary Force (BEF) wade out to..",
  },
  {
    title: "May 1940",
    cardTitle: "Dunkirk",
    url: "http://www.history.com",
    cardSubtitle:"Men of the British Expeditionary Force (BEF) wade out to..",
    cardDetailedText: "Men of the British Expeditionary Force (BEF) wade out to..",
    media: {
      type: "IMAGE",
      source: {
        url: "http://someurl/image.jpg"
      }
    }
  },
  {
    title: "May 1940",
    cardTitle: "Dunkirk",
    url: "http://www.history.com",
    cardSubtitle:"Men of the British Expeditionary Force (BEF) wade out to..",
    cardDetailedText: "Men of the British Expeditionary Force (BEF) wade out to..",
  },
  {
    title: "May 1940",
    cardTitle: "Dunkirk",
    url: "http://www.history.com",
    cardSubtitle:"Men of the British Expeditionary Force (BEF) wade out to..",
    cardDetailedText: "Men of the British Expeditionary Force (BEF) wade out to..",
  },
  {
    title: "May 1940",
    cardTitle: "Dunkirk",
    url: "http://www.history.com",
    cardSubtitle:"Men of the British Expeditionary Force (BEF) wade out to..",
    cardDetailedText: "Men of the British Expeditionary Force (BEF) wade out to..",
  },
]

const ChronoView: React.FC<{}> = () => {
  const [dateRange, setDateRange] = useState([dayjs().subtract(13, 'day') ,dayjs()])

  // 由于useMemo 不支持 async，只能使用useEffect 来替代？这不合理, 被迫将 useEffect 当作监听来用
  const [data, setData] = useState<TimelineItem[]>([])
  useEffect(() => {
    const [start, end] = dateRange
    getJouralPageBlocksTree(start, end)
      .then(async res => {
        const { preferredDateFormat } = await logseq.App.getUserConfigs()
        setData(await Promise.all(res.map(async (page, index) => {
          const date = start.add(index, 'day')
          return {
            title: format(date.toDate(), preferredDateFormat),
            cardDetailedText: await convertPageToCardData(page),
          }
        })?.reverse()))
      })
  }, [dateRange[0]?.valueOf(), dateRange[1]?.valueOf()])

  return (
    <div className="w-full h-full absolute top-0 left-0">
      {/* @ts-ignore */}
      <DatePicker.RangePicker value={dateRange} onChange={setDateRange} className="absolute z-50 top-4 left-14 shadow-lg" />
      <Chrono
        slideShow
        enableOutline
        useReadMore
        allowDynamicUpdate
        items={data}
        cardHeight={70}
        mode="VERTICAL"
      >
        {
          data.map(item => (
            <div className="w-full">
              {/* <p className="whitespace-pre-line">{item?.cardDetailedText}</p> */}
              <div dangerouslySetInnerHTML={{ __html: typeof item?.cardDetailedText === 'string' ? item?.cardDetailedText : (item?.cardDetailedText?.join('') || '') }}></div>
            </div>
          ))
        }
      </Chrono>
    </div>
  )
}

const convertPageToCardData = async (blocks: BlockEntity[] | null): Promise<string | string[]> => {
  if (!blocks) return 'No data'
  const promiseList = blocks.map(block => {
    return extractBlockContentToHtml(block)
  })
  return Promise.allSettled(promiseList).then(res => {
    return res.map(item => {
      // @ts-ignore
      return item.value
    })
  })
}

export default ChronoView
