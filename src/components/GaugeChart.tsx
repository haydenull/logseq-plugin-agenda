import type { ECharts } from 'echarts/lib/echarts'
import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import useTheme from '@/hooks/useTheme'
import { GAUGE_COLOR_CONFIG } from '@/constants/theme'
import { getOS } from '@/util/util'

const os = getOS()

const GaugeChart: React.FC<{
  progress: number
  uniqueId?: string
  height?: number
  type?: 'primary' | 'normal'
}> = ({ progress = 0, uniqueId = '', height = 160, type = 'primary' }) => {
  const chartRef = useRef<ECharts>()
  const theme = useTheme()
  useEffect(() => {
    const charDom = document.getElementById('gauge' + uniqueId)
    async function initChart() {
      if (!charDom || !theme) return
      const colorConfig = GAUGE_COLOR_CONFIG[theme]
      const height = type === 'normal' ? 20 : 60
      const lineWidth = type === 'normal' ? 4 : 7
      const option = {
        series: [
          {
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            min: 0,
            max: 100,
            splitNumber: 12,
            grid: {
              left: '0',
              right: '0',
              bottom: '0',
              containLabel: true,
            },
            itemStyle: {
              color: colorConfig.lineColor,
              shadowColor: colorConfig.shadowColor,
              shadowBlur: type === 'normal' ? 3 : 10,
              shadowOffsetX: type === 'normal' ? 0 : 2,
              shadowOffsetY: type === 'normal' ? 0 : 2,
            },
            progress: {
              show: true,
              roundCap: true,
              width: lineWidth,
            },
            pointer: {
              show: false,
            },
            axisLine: {
              roundCap: true,
              lineStyle: {
                width: lineWidth,
                color: [
                  [1, colorConfig.backColor],
                ],
              }
            },
            axisTick: {
              show: false,
            },
            splitLine: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            title: {
              show: false
            },
            detail: {
              show: true,
              // backgroundColor: '#fff',
              // borderColor: '#999',
              // borderWidth: 2,
              width: height,
              height: height,
              lineHeight: height + (os === 'windows' ? 4 : 0),
              // height: 40,
              borderRadius: 100,
              offsetCenter: [0, 0],
              valueAnimation: true,
              formatter: function (value) {
                return '{value|' + value.toFixed(0) + '}{unit|%}';
              },
              rich: {
                value: {
                  fontSize: type === 'normal' ? 15 : 34,
                  // fontWeight: 'bold',
                  color: colorConfig.colorPrimary,
                },
                unit: {
                  fontSize: type === 'normal' ? 10 : 15,
                  color: colorConfig.colorSecondary,
                  padding: type === 'normal' ? [0, 0, -2, 1] : [0, 0, -8, 2]
                }
              }
            },
            data: [
              {
                value: progress,
              }
            ]
          }
        ]
      }
      window.requestAnimationFrame(() => {
        const myChart = echarts.init(charDom)
        chartRef.current = myChart
        myChart.setOption(option)
      })
    }
    initChart()
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose()
      }
    }
  }, [progress, theme])
  return (
    <div>
      <div id={'gauge' + uniqueId} style={{ width: '100%', height: height + 'px' }} />
    </div>
  )
}

export default GaugeChart
