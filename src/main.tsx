import '@logseq/libs'
import React from 'react'
import ReactDOM from 'react-dom'
import * as echarts from 'echarts/core'
import { GridComponent, ToolboxComponent, TooltipComponent, LegendComponent} from 'echarts/components'
import { LineChart, GaugeChart, BarChart, TreemapChart, PieChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import 'antd/dist/reset.css'
import { getInitialSettings, initializeSettings } from '@/util/baseInfo'
import App from './App'
import 'tui-calendar/dist/tui-calendar.css'
import './style/index.less'
import { listenEsc, log, managePluginTheme, setPluginTheme, toggleAppTransparent } from '@/util/util'
import { togglePomodoro } from '@/helper/pomodoro'
import ModalApp, { IModalAppProps } from '@/apps/ModalApp'
import { LOGSEQ_PROVIDE_COMMON_STYLE } from '@/constants/style'
import { pullTask } from '@/helper/todoist'
import initializeDayjs from '@/register/dayjs'
import initializeTodoist from '@/register/todoist'
import initializeSidebar from '@/register/sidebar'
import initializePomodoro, { renderPomodoroApp } from '@/register/pomodoro'
import initializeClickLogseqDomListener from '@/register/logseq/clickLogseqDom'
import initializePageMenuItem from '@/register/pageMenuItem'
import initializeEditScheduleModal from '@/register/editScheduleModal'

echarts.use([GridComponent, LineChart, BarChart, GaugeChart, TreemapChart, PieChart, CanvasRenderer, UniversalTransition, ToolboxComponent, TooltipComponent, LegendComponent])

const isDevelopment = import.meta.env.DEV

if (isDevelopment) {
  // renderApp()
  // renderPomodoroApp('sdfasfasfsa')
  renderModalApp({ type: 'addDailyLog' })
} else {
  log('=== logseq-plugin-agenda loaded ===')
  logseq.ready(() => {
    initializeSettings()
    logseq.App.getUserConfigs().then(configs => {
      window.logseqAppUserConfigs = configs
    })
    // fix: https://github.com/haydenull/logseq-plugin-agenda/issues/87
    logseq.setMainUIInlineStyle({ zIndex: 1000 })
    logseq.provideStyle(LOGSEQ_PROVIDE_COMMON_STYLE)
    Notification.requestPermission()

    const { weekStartDay, todoist } = getInitialSettings()

    // ===== logseq plugin model start =====
    logseq.provideModel({
      show() {
        renderApp()
        logseq.showMainUI()
      },
      hide() {
        logseq.hideMainUI()
      },
      showPomodoro(e) {
        const uuid = e.dataset.uuid
        if (!uuid) return logseq.UI.showMsg('uuid is required')
        renderPomodoroApp(uuid)
        logseq.showMainUI()
      },
      pullTodoistTasks() {
        pullTask()
      },
    })
    // ===== logseq plugin model end =====
    // ========== show or hide app start =========
    logseq.App.registerUIItem('toolbar', {
      key: 'logseq-plugin-agenda',
      template: '<a data-on-click="show" class="button"><i class="ti ti-comet"></i></a>',
    })
    logseq.on('ui:visible:changed', (e) => {
      if (!e.visible && window.currentApp !== 'pomodoro') {
        ReactDOM.unmountComponentAtNode(document.getElementById('root') as Element)
      }
    })
    listenEsc(() => logseq.hideMainUI())
    logseq.App.registerCommandPalette({
      key: 'logseq-plugin-agenda:show',
      label: 'Show Agenda',
      keybinding: {
        binding: "ctrl+shift+s",
      },
    }, data => {
      renderApp()
      logseq.showMainUI()
    })
    // ========== show or hide app end =========

    // ========== today task list start =========
    logseq.Editor.registerSlashCommand("Agenda: Insert Today's Task", (e) => {
      renderModalApp({
        type: 'insertTodaySchedule',
        data: {
          uuid: e.uuid,
        },
      })
      logseq.showMainUI()
      return Promise.resolve()
    })
    // ========== today task list end =========

    // ========== dayjs start =========
    initializeDayjs(weekStartDay)
    // ========== dayjs end =========

    // ========== manage theme start =========
    managePluginTheme()
    logseq.App.onThemeModeChanged(({ mode }) => {
      setPluginTheme(mode)
    })
    // ========== manage theme end ==============

    // ========== todoist =========
    initializeTodoist(todoist)
    // ========== todoist ==============

    // ========== sidebar =========
    initializeSidebar()
    // ========== sidebar ==============

    // ========== pomodoro =========
    initializePomodoro()
    // ========== pomodoro ==============

    // ========== listen click logseq dom =========
    initializeClickLogseqDomListener()
    // ========== listen click logseq dom ==============

    initializePageMenuItem()
    initializeEditScheduleModal()
  })
}

async function renderApp() {
  window.currentApp = 'app'
  togglePomodoro(false)
  toggleAppTransparent(false)
  let defaultRoute = ''
  const page = await logseq.Editor.getCurrentPage()
  const { projectList = [] } = getInitialSettings()
  if (projectList.some(project => Boolean(project.id) && project.id === page?.originalName)) defaultRoute = `project/${encodeURIComponent(page?.originalName)}`
  ReactDOM.render(
    <React.StrictMode>
      <App defaultRoute={defaultRoute} />
    </React.StrictMode>,
    document.getElementById('root')
  )
}

// function renderModalApp({ type, initialValues }: { type: 'create' | 'update', initialValues?: IScheduleValue }) {
export function renderModalApp(params: IModalAppProps) {
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
