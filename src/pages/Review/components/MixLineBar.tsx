import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts/lib/echarts'
import dayjs from 'dayjs'
import { POLYGONAL_COLOR_CONFIG } from '@/constants/theme'
import { getCurrentTheme } from '@/util/logseq'
import useTheme from '@/hooks/useTheme'
import { IPomodoroInfo } from '@/helper/pomodoro'

const Polygonal: React.FC<{
  data: { date: number; pomodoros: IPomodoroInfo[] }[]
}> = ({ data }) => {
  const chartRef = useRef<ECharts>()
  const theme = useTheme()

  useEffect(() => {
    const chartDom = document.getElementById('mix-line-bar')
    async function initChart() {
      if (!chartDom || !theme) return
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          }
        },
        toolbox: {
          feature: {
            dataView: { show: true, readOnly: false },
            magicType: { show: true, type: ['line', 'bar'] },
            restore: { show: true },
            saveAsImage: { show: true }
          }
        },
        legend: {
          data: ['Evaporation', 'Precipitation', 'Temperature']
        },
        xAxis: [
          {
            type: 'category',
            data: data.map(item => {
              const day = dayjs(item.date).format('DD')
              if (day === '01') return dayjs(item.date).format('MM.DD')
              return day
            }),
            axisPointer: {
              type: 'shadow'
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: 'Pomodoro Amount',
            // min: 0,
            // max: 250,
            interval: 1,
            axisLabel: {
              formatter: '{value}'
            }
          },
          {
            type: 'value',
            name: 'Pomodoro Length',
            // min: 0,
            // max: 25,
            interval: 20,
            axisLabel: {
              formatter: '{value} min'
            }
          }
        ],
        series: [
          {
            name: 'Pomodoro Amount',
            type: 'bar',
            tooltip: {
              valueFormatter: function (value: number) {
                return value;
              }
            },
            data: data.map(item => item?.pomodoros?.length),
          },
          {
            name: 'Interruption Amount',
            type: 'bar',
            tooltip: {
              valueFormatter: function (value: number) {
                return value;
              }
            },
            data: data.map(item => item?.pomodoros?.reduce((acc, cur) => (acc + (cur.interruptions?.length || 0)), 0)),
          },
          {
            name: 'Pomodoro Length',
            type: 'line',
            yAxisIndex: 1,
            tooltip: {
              valueFormatter: function (value: number) {
                return value + ' min';
              }
            },
            data: data.map(item => Math.ceil((item?.pomodoros?.reduce((acc, cur) => (acc + cur.length), 0)) / 60)),
          }
        ]
      }
      // fix echarts canvas width bug
      // https://github.com/apache/echarts/issues/3894
      const _theme = theme === 'dark' ? 'dark' : 'light'
      window.requestAnimationFrame(() => {
        const myChart = echarts.init(chartDom, _theme)
        chartRef.current = myChart
        myChart.setOption(option)
      })
    }
    initChart()
    return () => {
      chartRef.current && chartRef.current.dispose()
    }
  }, [data, theme])

  return (
    <div id="mix-line-bar" style={{ height: '400px', width: '100%' }}></div>
  )
}

export default Polygonal
