import React, { useEffect, useRef, useState } from 'react'
import { Button, DatePicker, Descriptions, message } from 'antd'
import dayjs from 'dayjs'
import { ISchedule } from 'tui-calendar'
import { getInitalSettings } from '@/util/baseInfo'
import { getBlockData, getPageData } from '@/util/logseq'
import { ILogTag } from '@/util/type'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/lib/echarts'
import { copyToClipboard } from '@/util/util'

const Day: React.FC<{
  schedules: ISchedule[]
  tagList?: Array<ILogTag & { pageId: number }>
  type?: 'date' | 'week' | 'month' | 'quarter' | 'year'
}> = ({ schedules, tagList = [], type = 'date' }) => {
  const today = dayjs()
  const pieChartRef = useRef<ECharts>()
  const pieChartElementRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<ECharts>()
  const barChartElementRef = useRef<HTMLDivElement>(null)

  const [date, setDate] = useState(today)
  const dateDiff = date.endOf(type).diff(date.startOf(type), 'day') + 1
  const totalTime = 24 * 60 * dateDiff
  // @ts-ignore 类型正确
  const prevDate = date.subtract(1, type === 'date' ? 'day' : type)

  const validateSchedules = schedules.filter(schedule => {
    if (type === 'date') return (schedule.raw as any)?.page?.journalDay === Number(date.format('YYYYMMDD'))
    const start = date.startOf(type)
    const end = date.endOf(type)
    return dayjs((schedule.raw as any)?.page?.journalDay + '', 'YYYYMMDD').isBetween(start, end, 'day', '[]')
  })
  const recordDays = (new Set(validateSchedules.map(schedule => (schedule.raw as any)?.page?.journalDay))).size
  const prevPeriodvalidateSchedules = schedules.filter(schedule => {
    if (type === 'date') return (schedule.raw as any)?.page?.journalDay === Number(prevDate.format('YYYYMMDD'))
    const start = prevDate.startOf(type)
    const end = prevDate.endOf(type)
    return dayjs((schedule.raw as any)?.page?.journalDay + '', 'YYYYMMDD').isBetween(start, end, 'day', '[]')
  })

  const tagListWithTimeLength = tagList?.map(tag => {
    const tagSchedules = validateSchedules.filter(schedule => (schedule.raw as any).refs?.find(ref => ref.id === tag.pageId))
    return {
      ...tag,
      timeLength: tagSchedules.reduce((prev, cur) => {
        const start = cur.start
        const end = cur.end
        const length = dayjs(end as string).diff(dayjs(start as string), 'minute')
        return prev + length
      }, 0)
    }
  })
  const totalTimeLength = tagListWithTimeLength?.reduce((prev, cur) => prev + cur.timeLength, 0)
  const prevPeriodTagListWithTimeLength = tagList?.map(tag => {
    const tagSchedules = prevPeriodvalidateSchedules.filter(schedule => (schedule.raw as any).refs?.find(ref => ref.id === tag.pageId))
    return {
      ...tag,
      timeLength: tagSchedules.reduce((prev, cur) => {
        const start = cur.start
        const end = cur.end
        const length = dayjs(end as string).diff(dayjs(start as string), 'minute')
        return prev + length
      }, 0)
    }
  })

  const onClickExport = () => {
    const typeUpperCase = type.replace(type[0], type[0].toUpperCase())
    const legend = type === 'date' ? ['Yesterday', 'Today'] : [`Last ${typeUpperCase}`, `This ${typeUpperCase}`]
    const pieOption = {
      title: {
        text: 'Time Length',
        left: 'center',
      },
      tooltip: {
        trigger: 'item'
      },
      label: {
        alignTo: 'edge',
        formatter: '{name|{b}}\n{time|{c} min}',
        minMargin: 5,
        edgeDistance: 10,
        lineHeight: 15,
        rich: {
          time: {
            fontSize: 10,
            color: '#999'
          }
        }
      },
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      series: [
        {
          type: 'pie',
          center: ['25%', '50%'],
          radius: ['40%', '70%'],
          data: [
            { value: totalTimeLength || null, name: 'Record Time' },
            { value: totalTime - (totalTimeLength || 0), name: 'Other Time', itemStyle: { color: '#ccc' } },
          ],
        },
        {
          type: 'pie',
          center: ['75%', '50%'],
          radius: ['40%', '70%'],
          data: tagListWithTimeLength?.filter(item => item.timeLength)?.map(item => ({
            value: item.timeLength || null,
            name: item.id,
            itemStyle: { color: item.bgColor },
          })),
        },
      ],
    }

    const barOption = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: legend,
      },
      xAxis: {
        type: 'category',
        data: tagListWithTimeLength?.filter((item, index) => prevPeriodTagListWithTimeLength?.[index].timeLength || tagListWithTimeLength?.[index]?.timeLength)?.map(item => item.id),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: legend[0],
          type: 'bar',
          data: prevPeriodTagListWithTimeLength?.filter((item, index) => item.timeLength || tagListWithTimeLength?.[index]?.timeLength)?.map(item => item.timeLength),
        },
        {
          name: legend[1],
          type: 'bar',
          data: tagListWithTimeLength?.filter((item, index) => item.timeLength || tagListWithTimeLength?.[index]?.timeLength)?.map(item => item.timeLength),
        },
      ],
    }
    const text = `- \`\`\`echarts
${JSON.stringify(pieOption)}
  \`\`\`
- \`\`\`echarts
${JSON.stringify(barOption)}
  \`\`\`
${tagListWithTimeLength?.filter(item => item.timeLength)?.map(item => (`- [[${item.id}]] ${item.timeLength}min`))?.join('\n')}`

    copyToClipboard(text)
    message.success('🥳 Copy to clipboard successfully!')
  }

  useEffect(() => {
    const charDom = pieChartElementRef.current
    async function initChart() {
      if (!charDom) return
      const option = {
        title: {
          text: 'Time Length',
          left: 'center',
        },
        tooltip: {
          trigger: 'item'
        },
        label: {
          alignTo: 'edge',
          formatter: '{name|{b}}\n{time|{c} min}',
          minMargin: 5,
          edgeDistance: 10,
          lineHeight: 15,
          rich: {
            time: {
              fontSize: 10,
              color: '#999'
            }
          }
        },
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        series: [
          {
            type: 'pie',
            center: ['25%', '50%'],
            radius: ['40%', '70%'],
            data: [
              { value: totalTimeLength || null, name: 'Record Time' },
              { value: totalTime - (totalTimeLength || 0), name: 'Other Time', itemStyle: { color: '#ccc' } },
            ],
          },
          {
            type: 'pie',
            center: ['75%', '50%'],
            radius: ['40%', '70%'],
            data: tagListWithTimeLength?.map(item => ({
              value: item.timeLength || null,
              name: item.id,
              itemStyle: { color: item.bgColor },
            })),
          },
        ],
      }
      window.requestAnimationFrame(() => {
        const myChart = echarts.init(charDom)
        pieChartRef.current = myChart
        myChart.setOption(option)
      })
    }
    initChart()
    return () => {
      if (pieChartRef.current) {
        pieChartRef.current.dispose()
      }
    }
  }, [totalTimeLength, tagListWithTimeLength])
  useEffect(() => {
    const charDom = barChartElementRef.current
    async function initChart() {
      if (!charDom) return
      const typeUpperCase = type.replace(type[0], type[0].toUpperCase())
      const legend = type === 'date' ? ['Yesterday', 'Today'] : [`Last ${typeUpperCase}`, `This ${typeUpperCase}`]
      const option = {
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: legend,
        },
        xAxis: {
          type: 'category',
          data: tagListWithTimeLength?.map(item => item.id),
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: legend[0],
            type: 'bar',
            data: prevPeriodTagListWithTimeLength?.map(item => item.timeLength),
          },
          {
            name: legend[1],
            type: 'bar',
            data: tagListWithTimeLength?.map(item => item.timeLength),
          },
        ],
      }
      window.requestAnimationFrame(() => {
        const myChart = echarts.init(charDom)
        barChartRef.current = myChart
        myChart.setOption(option)
      })
    }
    initChart()
    return () => {
      if (barChartRef.current) {
        barChartRef.current.dispose()
      }
    }
  }, [tagListWithTimeLength, prevPeriodTagListWithTimeLength])

  return (
    <div className="w-full h-full overflow-auto pb-4">
      <div className="mb-4 flex justify-between">
        <DatePicker
          defaultValue={today}
          picker={type}
          onChange={val => setDate(val || today)}
          className="mt-1 ml-1"
          disabledDate={current => current && current > today.endOf('day')}
        />
        <Button type="link" style={{ color: 'var(--ls-tertiary-background-color)' }} onClick={onClickExport}>Export</Button>
      </div>

      <div ref={pieChartElementRef} style={{ height: 300 }}></div>

      <div ref={barChartElementRef} style={{ height: 300 }}></div>

      <Descriptions title="Record" bordered>
        <Descriptions.Item label="Total" span={3}>{ totalTimeLength } min</Descriptions.Item>
        { type !== 'date' && <Descriptions.Item label="Average" span={3}>{ Math.round((totalTimeLength || 0) / dateDiff) } min</Descriptions.Item> }
        { type !== 'date' && <Descriptions.Item label="Record Days" span={3}>{ recordDays }</Descriptions.Item> }
        {
          tagListWithTimeLength?.map(item => (
            item.timeLength ? <Descriptions.Item label={item.id}>{item.timeLength} min</Descriptions.Item> : null
          ))
        }
      </Descriptions>
    </div>
  )
}

export default Day
