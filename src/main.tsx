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
import TaskListApp from './TaskListApp'
import { IScheduleValue } from '@/components/ModifySchedule'
import { getBlockData, getBlockUuidFromEventPath, isEnabledAgendaPage, pureTaskBlockContent } from './util/logseq'
import { LOGSEQ_PROVIDE_COMMON_STYLE } from './constants/style'
import { transformBlockToEvent } from './helper/transform'

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

    logseq.App.getUserConfigs().then(configs => {
      window.logseqAppUserConfigs = configs
    })

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

    const editSchedule = async (e) => {
      let block = await logseq.Editor.getBlock(e.uuid)
      const blockRefs = await Promise.all(block!.refs?.map(ref => logseq.Editor.getPage(ref.id)))
      block!.refs = blockRefs
      const event = await transformBlockToEvent(block!, getInitalSettings())
      renderModalApp({
        type: 'editSchedule',
        data: {
          type: 'update',
          initialValues: {
            id: event.uuid,
            start: dayjs(event.addOns.start),
            end: dayjs(event.addOns.end),
            isAllDay: event.addOns.allDay,
            calendarId: event.addOns.calendarConfig?.id,
            title: event.addOns.showTitle,
            // keepRef: schedule.calendarId?.toLowerCase() === 'journal',
            raw: event,
          },
        },
        showKeepRef: true,
      })


      // const schedule = schedules.find(s => s.id === e.uuid)
      // console.log('[faiz:] === schedule', schedule)
      // const blockData = await logseq.Editor.getBlock(e.uuid)
      // const { defaultDuration, projectList } = getInitalSettings()
      // if (schedule) {
      //   const start = dayjs(schedule.start as string)
      //   const end = schedule.end ? dayjs(schedule.end as string) : start.add(defaultDuration.value, defaultDuration.unit)
      //   // update
      //   renderModalApp({
      //     type: 'editSchedule',
      //     data: {
      //       type: 'update',
      //       initialValues: {
      //         id: schedule.id,
      //         start,
      //         end,
      //         isAllDay: schedule?.raw?.category !== 'time',
      //         calendarId: schedule.calendarId,
      //         title: deleteProjectTaskTime(pureTaskBlockContent(blockData!)),
      //         keepRef: schedule.calendarId?.toLowerCase() === 'journal',
      //         raw: schedule.raw,
      //       },
      //     },
      //     showKeepRef: true,
      //   })
      // } else {
      //   // convert block to schedule
      //   const pageData = await logseq.Editor.getPage(blockData!.page?.id)
      //   console.log('[faiz:] === pageData', pageData)
      //   if (!pageData) return logseq.App.showMsg('Failed to get page data', 'error')
      //   renderModalApp({
      //     type: 'editSchedule',
      //     data: {
      //       type: 'update',
      //       initialValues: {
      //         id: e.uuid,
      //         title: deleteProjectTaskTime(pureTaskBlockContent(blockData!)),
      //         calendarId: ((pageData as any)?.properties?.agenda || projectList?.some(project => project.id === pageData.originalName)) ? pageData.originalName : undefined,
      //         isAllDay: true,
      //         start: dayjs(),
      //         end: dayjs(),
      //         keepRef: false,
      //         raw: blockData,
      //       },
      //     },
      //     showKeepRef: true,
      //   })
      // }
      logseq.showMainUI()
    }
    logseq.Editor.registerBlockContextMenuItem('Agenda: Modify Schedule', editSchedule)
    logseq.Editor.registerSlashCommand('Agenda: Modify Schedule', editSchedule)
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
    logseq.Editor.registerSlashCommand('Agenda: Insert Task List', async () => {
      logseq.Editor.insertAtEditingCursor(`{{renderer agenda, task-list}}`)
    })
    logseq.App.onMacroRendererSlotted(async ({ slot, payload: { arguments: args, uuid } }) => {
      console.log('[faiz:] === onMacroRendererSlotted', slot, args, uuid)
      if (args?.[0] !== 'agenda' || args?.[1] !== 'task-list') return
      const renderered = parent.document.getElementById(slot)?.childElementCount
      console.log('[faiz:] === is renderered', renderered)
      if (renderered) return

      const id = `agenda-task-list-${slot}`
      logseq.provideUI({
        key: `agenda-${slot}`,
        slot,
        reset: true,
        template: `<div id="${id}"></div>`,
        // style: {},
      })
      logseq.provideStyle(`${LOGSEQ_PROVIDE_COMMON_STYLE}
        #block-content-${uuid} .lsp-hook-ui-slot {
          width: 100%;
        }
        #block-content-${uuid} .lsp-hook-ui-slot > div {
          width: 100%;
        }
        #block-content-${uuid} .lsp-hook-ui-slot > div > div {
          width: 100%;
        }
      `)
      setTimeout(() => {
        ReactDOM.render(
          <React.StrictMode>
            <TaskListApp containerId={id} />
          </React.StrictMode>,
          parent.document.getElementById(id)
        )
      }, 0)
    })

    logseq.provideStyle(LOGSEQ_PROVIDE_COMMON_STYLE)

    if (top) {
      top.document.addEventListener('click', async e => {
        const path = e.composedPath()
        const target = path[0] as HTMLAnchorElement
        if (target.tagName === 'A' && target.className.includes('external-link') && target.getAttribute('href')?.startsWith('#agenda://')) {
          const uuid = getBlockUuidFromEventPath(path as unknown as HTMLElement[])
          if (!uuid) return
          const block = await logseq.Editor.getBlock(uuid)
          const page = await logseq.Editor.getPage(block!.page?.id)
          const event = await transformBlockToEvent(block!, getInitalSettings())
          renderModalApp({
            type: 'editSchedule',
            data: {
              type: 'update',
              initialValues: {
                id: uuid,
                title: event.addOns.showTitle,
                calendarId: page?.originalName,
                keepRef: false,
                start: dayjs(event.addOns.start),
                end: dayjs(event.addOns.end),
                isAllDay: event.addOns.allDay,
                raw: event,
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
  const { projectList = [] } = getInitalSettings()
  if (isEnabledAgendaPage(page?.originalName) || projectList.some(project => project.id === page?.originalName)) defaultRoute = `project/${page?.originalName}`
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
