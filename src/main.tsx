import '@logseq/libs'
import React from 'react'
import ReactDOM from 'react-dom'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import updateLocale from 'dayjs/plugin/updateLocale'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import localeData from 'dayjs/plugin/localeData'
import difference from 'lodash/difference'
import isBetween from 'dayjs/plugin/isBetween'
import * as echarts from 'echarts/core'
import { GridComponent, ToolboxComponent, TooltipComponent, LegendComponent} from 'echarts/components'
import { LineChart, GaugeChart, BarChart, TreemapChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { getInitalSettings, initializeSettings } from './util/baseInfo'
import App from './App'
import 'tui-calendar/dist/tui-calendar.css'
import './style/index.less'
import { listenEsc, managePluginTheme, setPluginTheme, toggleAppTransparent } from './util/util'
import { genToolbarPomodoro, togglePomodoro } from '@/helper/pomodoro'
import ModalApp, { IModalAppProps } from './ModalApp'
import TaskListApp from './TaskListApp'
import { IScheduleValue } from '@/components/ModifySchedule'
import { getBlockData, getBlockUuidFromEventPath, isEnabledAgendaPage, pureTaskBlockContent } from './util/logseq'
import { LOGSEQ_PROVIDE_COMMON_STYLE } from './constants/style'
import { transformBlockToEvent } from './helper/transform'
import PomodoroApp from './PomodoroApp'

dayjs.extend(weekday)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(localeData)
dayjs.extend(difference)
dayjs.extend(isBetween)
dayjs.extend(updateLocale)

echarts.use([GridComponent, LineChart, BarChart, GaugeChart, TreemapChart, CanvasRenderer, UniversalTransition, ToolboxComponent, TooltipComponent, LegendComponent])

const isDevelopment = import.meta.env.DEV

if (isDevelopment) {
  renderApp('browser')
  // renderPomodoroApp('sdfasfasfsa')
} else {
  console.log('=== logseq-plugin-agenda loaded ===')
  logseq.ready(() => {

    initializeSettings()

    dayjs.updateLocale('en', {
      weekStart: getInitalSettings().weekStartDay,
    })

    managePluginTheme()

    Notification.requestPermission()

    logseq.App.getUserConfigs().then(configs => {
      window.logseqAppUserConfigs = configs
    })

    listenEsc(() => logseq.hideMainUI())

    logseq.App.onThemeModeChanged(({ mode }) => {
      setPluginTheme(mode)
    })

    logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
      console.log('[faiz:] === mian DB.onChanged', blocks, txData, txMeta)
    })

    // setInterval(async () => {
    //   const editing = await logseq.Editor.checkEditing()
    //   console.log('[faiz:] === editing', editing)
    //   const currentBlock = await logseq.Editor.getCurrentBlock()
    //   console.log('[faiz:] === currentBlock', currentBlock)
    // }, 2000)

    logseq.on('ui:visible:changed', (e) => {
      if (!e.visible && window.currentApp !== 'pomodoro') {
        ReactDOM.unmountComponentAtNode(document.getElementById('root') as Element)
      }
    })

    logseq.provideModel({
      show() {
        renderApp('logseq')
        logseq.showMainUI()
      },
      showPomodoro(e) {
        const uuid = e.dataset.uuid
        if (!uuid) return logseq.App.showMsg('uuid is required')
        renderPomodoroApp(uuid)
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

    window.unmountPomodoroApp = () => ReactDOM.unmountComponentAtNode(document.getElementById('pomodoro-root') as Element)
    window.interruptionMap = new Map()

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
      logseq.showMainUI()
    }
    logseq.Editor.registerBlockContextMenuItem('Agenda: Modify Schedule', editSchedule)
    logseq.Editor.registerBlockContextMenuItem('Agenda: Start pomodoro Timer', async ({ uuid }) => {
      // logseq.Editor.insertAtEditingCursor(`{{renderer agenda, pomodoro-timer, 40, 'nostarted', 0}}`)
      logseq.App.registerUIItem('toolbar', {
        key: 'logseq-plugin-agenda-pomodoro',
        template: genToolbarPomodoro(uuid, '--:--', 0),
      })
      if (window?.currentPomodoro?.uuid !== uuid && window?.currentPomodoro?.state?.paused === false) return logseq.App.showMsg('Another block is running pomodoro timer, please finish it first', 'error')
      setTimeout(() => {
        renderPomodoroApp(uuid)
        logseq.showMainUI()
      }, 0)
    })
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
      if (args?.[0] !== 'agenda') return
      if (args?.[1] === 'task-list') {
        const renderered = parent.document.getElementById(slot)?.childElementCount
        console.log('[faiz:] === is task-list renderered', renderered)
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
      } else if (args?.[1] === 'pomodoro-timer') {
        const renderered = parent.document.getElementById(slot)?.childElementCount
        console.log('[faiz:] === is pomodoro-timer renderered', renderered)

        const id = `agenda-pomodoro-timer-${slot}`
        const duration = args?.[2] || 40
        const status = args?.[3] || 'nostarted'
        const count = args?.[4] || 0
        logseq.provideUI({
          key: `agenda-${slot}`,
          slot,
          reset: true,
          template: `<div id="${id}"></div>`,
          // style: {},
        })
        // setTimeout(() => {
        //   ReactDOM.render(
        //     <React.StrictMode>
        //       <PomodoroApp duration={Number(duration)} initialStatus={status} uuid={uuid} />
        //     </React.StrictMode>,
        //     parent.document.getElementById(id)
        //   )
        // }, 0)
      }
    })

    logseq.provideStyle(LOGSEQ_PROVIDE_COMMON_STYLE)

    if (top) {
      top.document.addEventListener('click', async e => {
        const path = e.composedPath()
        const target = path[0] as HTMLAnchorElement
        if (target.tagName === 'A' && target.className.includes('external-link') && target.getAttribute('href')?.startsWith('#agenda')) {
          let modalType = 'agenda'
          if (target.getAttribute('href')?.startsWith('#agenda-pomo://')) modalType = 'pomodoro'

          const uuid = getBlockUuidFromEventPath(path as unknown as HTMLElement[])
          if (!uuid) return
          const block = await logseq.Editor.getBlock(uuid)
          const page = await logseq.Editor.getPage(block!.page?.id)
          const event = await transformBlockToEvent(block!, getInitalSettings())
          if (modalType === 'agenda') {
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
          } else if (modalType === 'pomodoro') {
            renderModalApp({
              type: 'pomodoro',
              data: event,
            })
          }
          logseq.showMainUI()
        }
      })
    }

  })
}

async function renderApp(env: string) {
  window.currentApp = 'app'
  togglePomodoro(false)
  toggleAppTransparent(false)
  let defaultRoute = ''
  const page = await logseq.Editor.getCurrentPage()
  const { projectList = [] } = getInitalSettings()
  if (projectList.some(project => Boolean(project.id) && project.id === page?.originalName)) defaultRoute = `project/${encodeURIComponent(page?.originalName)}`
  console.log('[faiz:] === defaultRoute', defaultRoute)
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
  window.currentApp = 'modal'
  togglePomodoro(false)
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

function renderPomodoroApp(uuid: string) {
  window.currentApp = 'pomodoro'
  togglePomodoro(true)
  toggleAppTransparent(true)
  ReactDOM.render(
    <React.StrictMode>
      <PomodoroApp uuid={uuid} />
    </React.StrictMode>,
    document.getElementById('pomodoro-root')
  )
}
