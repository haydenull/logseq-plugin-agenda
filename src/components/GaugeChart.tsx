import type { ECharts } from 'echarts/lib/echarts'
import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts/core'

// purpose
// const BACK_COLOR = '#f2f6ff'
// const LINE_COLOR = '#5146a0'
// const SHADOW_COLOR = 'rgba(58,77,233,0.8)'
// const COLOR_PRIMARY = '#333'
// const COLOR_SECONDARY = '#777'

// green
// const BACK_COLOR = '#e9f2f0'
// const LINE_COLOR = '#058f68'
// const SHADOW_COLOR = 'rgba(5, 143, 104, 0.8)'
// const COLOR_PRIMARY = '#333'
// const COLOR_SECONDARY = '#777'

// dark
const BACK_COLOR = '#212528'
const LINE_COLOR = '#d19811'
const SHADOW_COLOR = 'rgba(33, 37, 40, 0.8)'
const COLOR_PRIMARY = '#fafafe'
const COLOR_SECONDARY = '#aaadb3'

const GaugeChart: React.FC<{
  progress: number
}> = ({ progress = 0 }) => {
  const chartRef = useRef<ECharts>()
  useEffect(() => {
    const charDom = document.getElementById('gauge')
    if (charDom) {
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
              color: LINE_COLOR,
              shadowColor: SHADOW_COLOR,
              shadowBlur: 10,
              shadowOffsetX: 2,
              shadowOffsetY: 2
            },
            progress: {
              show: true,
              roundCap: true,
              width: 7,
            },
            pointer: {
              show: false,
            },
            axisLine: {
              roundCap: true,
              lineStyle: {
                width: 7,
                color: [
                  [1, BACK_COLOR]
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
              width: 60,
              height: 60,
              lineHeight: 60,
              // height: 40,
              borderRadius: 100,
              offsetCenter: [0, 0],
              valueAnimation: true,
              formatter: function (value) {
                return '{value|' + value.toFixed(0) + '}{unit|%}';
              },
              rich: {
                value: {
                  fontSize: 34,
                  // fontWeight: 'bold',
                  color: COLOR_PRIMARY,
                },
                unit: {
                  fontSize: 15,
                  color: COLOR_SECONDARY,
                  padding: [0, 0, -8, 2]
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
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose()
      }
    }
  }, [progress])
  return (
    <div>
      <div id="gauge" style={{ width: '100%', height: '160px' }} />
    </div>
  )
}

export default GaugeChart
