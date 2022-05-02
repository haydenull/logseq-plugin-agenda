import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/lib/echarts'
import dayjs from 'dayjs'
import { POLYGONAL_COLOR_CONFIG } from '@/constants/theme'
import { getCurrentTheme } from '@/util/logseq'

const Polygonal: React.FC<{
  data: { date: string; value: number }[]
}> = ({ data }) => {
  const chartRef = useRef<ECharts>()

  useEffect(() => {
    const chartDom = document.getElementById('polygonal')
    async function initChart() {
      const theme = await getCurrentTheme()
      const colorConfig = POLYGONAL_COLOR_CONFIG[theme]
      const option = {
        xAxis: {
          type: 'category',
          data: data.map(item => {
            const day = dayjs(item.date).format('DD')
            if (day === '01') return dayjs(item.date).format('MM.DD')
            return day
          }),
          axisTick: {
            show: false,
          },
          axisLine: {
            show: false,
          },
        },
        yAxis: {
          // show: false,
          type: 'value',
          splitLine:{show: false}, //去除网格线
          // axisTick: {
          //   show: false,
          // },
          // axisLine: {
          //   show: false,
          // },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        series: [
          {
            data: data.map(item => item.value),
            type: 'line',
            smooth: true,
            emphasis: {
              focus: 'series'
            },
            showSymbol: false,
            itemStyle: {
              color: colorConfig.lineColor,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: colorConfig.backColor
                },
                {
                  offset: 1,
                  color: colorConfig.backColorEnd,
                }
              ])
            }
          }
        ]
      }
      // fix echarts canvas width bug
      // https://github.com/apache/echarts/issues/3894
      window.requestAnimationFrame(() => {
        if (chartDom) {
          const myChart = echarts.init(chartDom)
          chartRef.current = myChart
          myChart.setOption(option)
        }
      })
    }
    if (chartDom) {
      initChart()
    }
    return () => {
      chartRef.current && chartRef.current.dispose()
    }
  }, [data])

  return (
    <div id="polygonal" style={{ height: '240px', width: '100%' }}></div>
  )
}

export default Polygonal
