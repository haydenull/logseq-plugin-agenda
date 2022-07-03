import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/lib/echarts'
import useTheme from '@/hooks/useTheme'

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
        title: {
          text: 'Project Time',
          left: 'center',
        },
        toolbox: {
          feature: {
            dataView: { show: true, readOnly: true },
            saveAsImage: { show: true }
          }
        },
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
            name: 'Project Time',
            type: 'treemap',
            visibleMin: 300,
            data,
            label: {
              show: true,
              formatter: '{b}'
            },
            upperLabel: {
              show: true,
              height: 30,
            },
            itemStyle: {
              borderColor: '#fff',
            },
            levels: [
              {
                itemStyle: {
                  borderColor: '#777',
                  borderWidth: 0,
                  gapWidth: 1
                },
                upperLabel: {
                  show: false
                }
              },
              {
                itemStyle: {
                  borderColor: '#555',
                  borderWidth: 5,
                  gapWidth: 1
                },
                emphasis: {
                  itemStyle: {
                    borderColor: '#ddd'
                  }
                }
              },
              {
                colorSaturation: [0.35, 0.5],
                itemStyle: {
                  borderWidth: 5,
                  gapWidth: 1,
                  borderColorSaturation: 0.6
                }
              }
            ],
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
