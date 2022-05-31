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
import { getInitalSettings, initializeSettings } from './util/baseInfo'
import App from './App'
import 'tui-calendar/dist/tui-calendar.css'
import './style/index.less'
import { listenEsc, managePluginTheme, setPluginTheme, toggleAppTransparent } from './util/util'
import ModalApp, { IModalAppProps } from './ModalApp'
import { IScheduleValue } from '@/components/ModifySchedule'
import { getBlockData, getBlockUuidFromEventPath, isEnabledAgendaPage, pureTaskBlockContent } from './util/logseq'
import { convertBlockToSchedule, getProjectTaskTime, getSchedules } from './util/schedule'
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

    managePluginTheme()

    listenEsc(() => logseq.hideMainUI())

    logseq.App.onThemeModeChanged(({ mode }) => {
      setPluginTheme(mode)
    })

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
    logseq.Editor.registerBlockContextMenuItem('Agenda: Edit Schedule', async (e) => {
      const blockData = await logseq.Editor.getBlock(e.uuid)
      console.log('[faiz:] === blockData', blockData)
      if (!blockData) return
      const schedules = await getSchedules()
      const schedule = schedules.find(s => Number(s.id) === blockData.id)
      console.log('[faiz:] === schedule', schedule)
      const { defaultDuration } = getInitalSettings()
      if (schedule) {
        const start = dayjs(schedule.start as string)
        const end = schedule.end ? dayjs(schedule.end as string) : start.add(defaultDuration.value, defaultDuration.unit)
        // update
        renderModalApp({
          type: 'editSchedule',
          data: {
            type: 'update',
            initialValues: {
              id: schedule.id,
              start,
              end,
              isAllDay: schedule?.raw?.category !== 'time',
              calendarId: schedule.calendarId,
              title: (schedule.raw as unknown as BlockEntity)?.content?.split?.('\n')[0],
              keepRef: schedule.calendarId?.toLowerCase() === 'journal',
              raw: schedule.raw,
            },
          },
          showKeepRef: true,
        })
      } else {
        // convert block to schedule
        const pageData = await logseq.Editor.getPage(blockData.page?.id)
        console.log('[faiz:] === pageData', pageData)
        if (!pageData) return logseq.App.showMsg('Failed to get page data', 'error')
        renderModalApp({
          type: 'editSchedule',
          data: {
            type: 'update',
            initialValues: {
              id: String(blockData.id),
              title: blockData?.content,
              calendarId: (pageData as any)?.properties?.agenda ? pageData.originalName : undefined,
              isAllDay: true,
              start: dayjs(),
              end: dayjs(),
              keepRef: false,
            },
          },
          showKeepRef: true,
        })
      }
      logseq.showMainUI()
    })
    logseq.Editor.registerSlashCommand("Agenda: Insert Today's Task", (e) => {
      console.log('[faiz:] === registerSlashCommand', e)
      renderModalApp({
        type: 'insertTodaySchedule',
        data: {
          uuid: e.uuid,
        },
      })
      logseq.showMainUI()
      return Promise.resolve()
    })

    logseq.provideStyle(`
      .external-link[href^="#agenda://"]::before {
        content: '📅';
        margin: 0 4px;
      }
    `)

    if (top) {
      top.document.addEventListener('click', async e => {
        const path = e.composedPath()
        const target = path[0] as HTMLAnchorElement
        if (target.tagName === 'A' && target.className.includes('external-link') && target.getAttribute('href')?.startsWith('#agenda://')) {
          const uuid = getBlockUuidFromEventPath(path as unknown as HTMLElement[])
          if (!uuid) return
          const block = await logseq.Editor.getBlock(uuid)
          const page = await logseq.Editor.getPage(block!.page?.id)
          const time = getProjectTaskTime(block?.content!)
          renderModalApp({
            type: 'editSchedule',
            data: {
              type: 'update',
              initialValues: {
                id: uuid,
                title: pureTaskBlockContent(block!),
                calendarId: page?.originalName,
                keepRef: false,
                start: time ? dayjs(time.start) : dayjs(),
                end: time ? dayjs(time.end) : dayjs(),
                isAllDay: time?.allDay !== 'false',
              },
            },
          })
          logseq.showMainUI()
        }
      })
    }

  })
}

async function renderApp(env: string) {
  toggleAppTransparent(false)
  let defaultRoute = ''
  const page = await logseq.Editor.getCurrentPage()
  if (page && isEnabledAgendaPage(page.originalName)) defaultRoute = `project/${page.originalName}`
  ReactDOM.render(
    <React.StrictMode>
      {/* <App env={env} /> */}
      <App defaultRoute={defaultRoute} />
    </React.StrictMode>,
    document.getElementById('root')
  )
}

// function renderModalApp({ type, initialValues }: { type: 'create' | 'update', initialValues?: IScheduleValue }) {
function renderModalApp(params: IModalAppProps) {
  const {type, data} = params
  toggleAppTransparent(true)
  ReactDOM.render(
    <React.StrictMode>
      {/* @ts-ignore */}
      <ModalApp type={type} data={data} showKeepRef={params.showKeepRef} />
    </React.StrictMode>,
    document.getElementById('root')
  )
}
