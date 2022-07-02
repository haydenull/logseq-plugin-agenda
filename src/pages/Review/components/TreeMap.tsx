import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts/lib/echarts'
import dayjs from 'dayjs'
import { POLYGONAL_COLOR_CONFIG } from '@/constants/theme'
import { getCurrentTheme } from '@/util/logseq'
import useTheme from '@/hooks/useTheme'
import { IPomodoroInfo } from '@/helper/pomodoro'

export type IData = {
  name: string
  value: number
}
const Polygonal: React.FC<{
  data: { name: string; value: number; children: IData[] }[]
}> = ({ data }) => {
  const chartRef = useRef<ECharts>()
  const theme = useTheme()

  useEffect(() => {
    const chartDom = document.getElementById('treemap')
    const formatUtil = echarts.format
    async function initChart() {
      if (!chartDom || !theme) return
      const option = {
        tooltip: {
          formatter: function (info: any) {
            var value = info.value;
            var treePathInfo = info.treePathInfo;
            var treePath = [];

            for (var i = 1; i < treePathInfo.length; i++) {
              // @ts-ignore
              treePath.push(treePathInfo[i].name);
            }

            return [
              '<div class="tooltip-title">' +
                formatUtil.encodeHTML(treePath.join('/')) +
                '</div>',
              'Pomodoro Length: ' + formatUtil.addCommas(value) + ' min'
            ].join('');
          }
        },
        series: [
          {
            type: 'treemap',
            visibleMin: 300,
            data,
            label: {
              show: true,
              formatter: '{b}'
            },
            itemStyle: {
              borderColor: '#fff',
            },
          }
        ]
      };

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
    <div id="treemap" style={{ height: '600px', width: '100%' }}></div>
  )
}

export default Polygonal
