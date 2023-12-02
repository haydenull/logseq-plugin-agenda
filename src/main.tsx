import '@logseq/libs'
import 'antd/dist/reset.css'
import { BarChart, GaugeChart, LineChart, PieChart, TreemapChart } from 'echarts/charts'
import { GridComponent, LegendComponent, ToolboxComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import proxyLogseq from 'logseq-proxy'
import React from 'react'
import { type Root, createRoot } from 'react-dom/client'
import 'tui-calendar/dist/tui-calendar.css'

import MainApp from '@/apps/MainApp'
import ModalApp, { type IModalAppProps } from '@/apps/ModalApp'
import { LOGSEQ_PROVIDE_COMMON_STYLE } from '@/constants/style'
import { togglePomodoro } from '@/helper/pomodoro'
import { pullTask } from '@/helper/todoist'
import initializeDayjs from '@/register/dayjs'
import initializeEditScheduleModal from '@/register/editScheduleModal'
import initializeClickLogseqDomListener from '@/register/logseq/clickLogseqDom'
import initializePageMenuItem from '@/register/pageMenuItem'
import initializePomodoro, { renderPomodoroApp } from '@/register/pomodoro'
import initializeSidebar from '@/register/sidebar'
import initializeTodoist from '@/register/todoist'
import { getInitialSettings, initializeSettings } from '@/util/baseInfo'
import { listenEsc, log, managePluginTheme, setPluginTheme, toggleAppTransparent } from '@/util/util'

import { track } from './Agenda3/helpers/umami'
import Agenda3App from './apps/Agenda3App'
import TaskListApp from './apps/TaskListApp'
import i18n from './locales/i18n'
import './style/index.less'

echarts.use([
  GridComponent,
  LineChart,
  BarChart,
  GaugeChart,
  TreemapChart,
  PieChart,
  CanvasRenderer,
  UniversalTransition,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
])

const isDevelopment = import.meta.env.DEV
let root: Root | null = null

if (import.meta.env.VITE_MODE === 'web') {
  // run in browser
  console.log('[faiz:] === meta.env.VITE_LOGSEQ_API_SERVER', import.meta.env.VITE_LOGSEQ_API_SERVER)
  console.log(`%c[version]: v${__APP_VERSION__}`, 'background-color: #60A5FA; color: white; padding: 4px;')
  proxyLogseq({
    config: {
      apiServer: import.meta.env.VITE_LOGSEQ_API_SERVER,
      apiToken: import.meta.env.VITE_LOGSEQ_API_TOKEN,
    },
    settings: window.mockSettings,
  })
  // logseq.provideStyle(`.drawer[data-drawer-name="agenda"] {display: none;}`)
  renderApp(true)
  // renderModalApp({ type: 'createTask' })
  // renderPomodoroApp('pomodoro')
  // renderModalApp({ type: 'addDailyLog' })
  // renderSidebar()
} else {
  log('=== logseq-plugin-agenda loaded ===')
  logseq.ready(() => {
    initializeSettings()
    logseq.App.getUserConfigs().then((configs) => {
      window.logseqAppUserConfigs = configs
      console.log('[faiz:] === configs', configs)
      i18n.changeLanguage(configs.preferredLanguage || 'en')
    })
    // fix: https://github.com/haydenull/logseq-plugin-agenda/issues/87
    logseq.setMainUIInlineStyle({ zIndex: 1000 })
    logseq.provideStyle(LOGSEQ_PROVIDE_COMMON_STYLE)
    Notification.requestPermission()

    const { weekStartDay, todoist } = getInitialSettings()

    const showAgenda3 = () => {
      track('Show Agenda', { version: __APP_VERSION__ })
      if (window.isMounted !== true) {
        renderApp(true)
        window.isMounted = true
      }
      setPluginTheme('light')
      logseq.showMainUI()
    }

    // ===== logseq plugin model start =====
    logseq.provideModel({
      show() {
        track('Show Agenda2', { version: __APP_VERSION__ })
        renderApp(false)
        managePluginTheme()
        logseq.showMainUI()
        window.isMounted = false
      },
      showAgenda3,
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
      key: 'Agenda2-Legacy',
      template: '<a data-on-click="show" class="button"><i class="ti ti-comet"></i></a>',
    })
    logseq.App.registerUIItem('toolbar', {
      key: 'Agenda3',
      template: '<a data-on-click="showAgenda3" class="button" style="color: orange;"><i class="ti ti-comet"></i></a>',
    })
    logseq.on('ui:visible:changed', (e) => {
      if (!e.visible && window.currentApp !== 'pomodoro' && window.currentApp !== 'agenda3App') {
        root && root.unmount()
      }
    })
    listenEsc(() => logseq.hideMainUI())
    logseq.App.registerCommandPalette(
      {
        key: 'Agenda:show',
        label: 'Show Agenda',
        keybinding: {
          binding: 'ctrl+shift+s',
        },
      },
      (data) => {
        showAgenda3()
      },
    )
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

async function renderApp(isVersion3 = false) {
  window.currentApp = isVersion3 ? 'agenda3App' : 'app'
  togglePomodoro(false)
  toggleAppTransparent(false)
  let defaultRoute = ''
  const page = await logseq.Editor.getCurrentPage().catch((err) => console.error(err))
  const { projectList = [] } = getInitialSettings()
  if (projectList.some((project) => Boolean(project.id) && project.id === page?.originalName)) {
    defaultRoute = `project/${encodeURIComponent(page?.originalName)}`
  }

  const html = document.querySelector('html')
  const body = document.querySelector('body')
  if (isVersion3) {
    html?.classList.add('agenda3')
    body?.classList.add('agenda3')
  } else {
    html?.classList.remove('agenda3')
    body?.classList.remove('agenda3')
  }

  root = createRoot(document.getElementById('root')!)
  root.render(
    <React.StrictMode>{isVersion3 ? <Agenda3App /> : <MainApp defaultRoute={defaultRoute} />}</React.StrictMode>,
  )
}

// function renderModalApp({ type, initialValues }: { type: 'create' | 'update', initialValues?: IScheduleValue }) {
export function renderModalApp(params: IModalAppProps) {
  window.currentApp = 'modal'
  togglePomodoro(false)
  toggleAppTransparent(true)

  const renderModalApp = () => {
    let app: React.ReactNode = null
    switch (params.type) {
      case 'modifySchedule':
        app = <ModalApp type="modifySchedule" data={params.data} />
        break
      case 'createTask':
        app = <ModalApp type="createTask" />
        break
      case 'addDailyLog':
        app = <ModalApp type="addDailyLog" />
        break
      case 'pomodoro':
        app = <ModalApp type="pomodoro" data={params.data} />
        break
      case 'insertTodaySchedule':
        app = <ModalApp type="insertTodaySchedule" data={params.data} />
    }
    return app
  }

  root = createRoot(document.getElementById('root')!)
  root.render(<React.StrictMode>{renderModalApp()}</React.StrictMode>)
}

function renderSidebar() {
  root = createRoot(document.getElementById('root')!)
  root.render(
    <React.StrictMode>
      <TaskListApp containerId="agenda-task-list-test" />
    </React.StrictMode>,
  )
}
