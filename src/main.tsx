import '@logseq/libs'
import React from 'react'
import ReactDOM from 'react-dom'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import localeData from 'dayjs/plugin/localeData'
import difference from 'lodash/difference'
import isBetween from 'dayjs/plugin/isBetween'
import * as echarts from 'echarts/core'
import { GridComponent, ToolboxComponent, TooltipComponent} from 'echarts/components'
import { LineChart, GaugeChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { initializeSettings } from './util/baseInfo'
import App from './App'
import 'tui-calendar/dist/tui-calendar.css'
import './style/index.less'
import { setPluginTheme } from './util/util'
import ModalApp from './ModalApp'
import { IScheduleValue } from '@/components/ModifySchedule'
import { getBlockData } from './util/logseq'
import { convertBlockToSchedule, getSchedules } from './util/schedule'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

dayjs.extend(weekday)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(localeData)
dayjs.extend(difference)
dayjs.extend(isBetween)

echarts.use([GridComponent, LineChart, GaugeChart, CanvasRenderer, UniversalTransition, ToolboxComponent, TooltipComponent])

const isDevelopment = import.meta.env.DEV

if (isDevelopment) {
  renderApp('browser')
} else {
  console.log('=== logseq-plugin-agenda loaded ===')
  logseq.ready(() => {

    initializeSettings()

    logseq.on('ui:visible:changed', (e) => {
      if (!e.visible) {
        ReactDOM.unmountComponentAtNode(document.getElementById('root') as Element)
      }
    })

    logseq.provideModel({
      show() {
        renderApp('logseq')
        logseq.showMainUI()
      },
    })

    logseq.App.registerUIItem('toolbar', {
      key: 'logseq-plugin-agenda',
      template: '<a data-on-click="show" class="button"><i class="ti ti-comet"></i></a>',
    })
    logseq.App.registerCommandPalette({
      key: 'logseq-plugin-agenda:show',
      label: 'Show Agenda',
    }, data => {
      renderApp('logseq')
      logseq.showMainUI()
    })
    logseq.Editor.registerBlockContextMenuItem('Agenda:Edit Task', async (e) => {
      const blockData = await logseq.Editor.getBlock(e.uuid)
      console.log('[faiz:] === blockData', blockData)
      if (!blockData) return
      const schedules = await getSchedules()
      const schedule = schedules.find(s => Number(s.id) === blockData.id)
      console.log('[faiz:] === schedule', schedule)
      if (!schedule) return logseq.App.showMsg('Schedule not found', 'error')
      renderModalApp({
        type: 'update',
        initialValues: {
          id: schedule.id,
          start: dayjs(schedule.start as string),
          end: dayjs(schedule.end as string),
          isAllDay: schedule.isAllDay,
          calendarId: schedule.calendarId,
          title: (schedule.raw as unknown as BlockEntity)?.content?.split?.('\n')[0],
          raw: schedule.raw,
        },
      })
      logseq.showMainUI()
    })

  })
}

function renderApp(env: string) {
  logseq.App.onThemeModeChanged(({ mode }) => {
    setPluginTheme(mode)
  })
  ReactDOM.render(
    <React.StrictMode>
      {/* <App env={env} /> */}
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  )
}

function renderModalApp({ type, initialValues }: { type: 'create' | 'update', initialValues?: IScheduleValue }) {
  ReactDOM.render(
    <React.StrictMode>
      <ModalApp type={type} initialValues={initialValues} />
    </React.StrictMode>,
    document.getElementById('root')
  )
}
