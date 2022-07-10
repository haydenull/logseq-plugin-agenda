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
import findKey from 'lodash/findKey'
import isBetween from 'dayjs/plugin/isBetween'
import utc from 'dayjs/plugin/utc'
import * as echarts from 'echarts/core'
import { GridComponent, ToolboxComponent, TooltipComponent, LegendComponent} from 'echarts/components'
import { LineChart, GaugeChart, BarChart, TreemapChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { getInitalSettings, initializeSettings } from './util/baseInfo'
import App from './App'
import 'tui-calendar/dist/tui-calendar.css'
import './style/index.less'
import { listenEsc, log, managePluginTheme, setPluginTheme, toggleAppTransparent } from './util/util'
import { genToolbarPomodoro, togglePomodoro } from '@/helper/pomodoro'
import ModalApp, { IModalAppProps } from './ModalApp'
import TaskListApp from './TaskListApp'
import { genDBTaskChangeCallback, getBlockUuidFromEventPath } from './util/logseq'
import { LOGSEQ_PROVIDE_COMMON_STYLE } from './constants/style'
import { transformBlockToEvent } from './helper/transform'
import PomodoroApp from './PomodoroApp'
import { pullTask, getTodoistInstance, updateTask, closeTask, getTask, reopenTask, createTask, updateBlock, PRIORITY_MAP } from './helper/todoist'
import { AddTaskArgs, TodoistRequestError, UpdateTaskArgs } from '@doist/todoist-api-typescript'
import { DEFAULT_PROJECT } from './util/constants'

dayjs.extend(weekday)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(localeData)
dayjs.extend(difference)
dayjs.extend(isBetween)
dayjs.extend(updateLocale)
dayjs.extend(utc)

echarts.use([GridComponent, LineChart, BarChart, GaugeChart, TreemapChart, CanvasRenderer, UniversalTransition, ToolboxComponent, TooltipComponent, LegendComponent])

const isDevelopment = import.meta.env.DEV

if (isDevelopment) {
  renderApp()
  // renderPomodoroApp('sdfasfasfsa')
} else {
  log('=== logseq-plugin-agenda loaded ===')
  logseq.ready(() => {

    initializeSettings()

    const { weekStartDay, todoist } = getInitalSettings()

    dayjs.updateLocale('en', {
      weekStart: weekStartDay,
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

    logseq.on('ui:visible:changed', (e) => {
      if (!e.visible && window.currentApp !== 'pomodoro') {
        ReactDOM.unmountComponentAtNode(document.getElementById('root') as Element)
      }
    })

    logseq.provideModel({
      show() {
        renderApp()
        logseq.showMainUI()
      },
      showPomodoro(e) {
        const uuid = e.dataset.uuid
        if (!uuid) return logseq.App.showMsg('uuid is required')
        renderPomodoroApp(uuid)
        logseq.showMainUI()
      },
      pullTodoistTasks() {
        pullTask()
      },
    })

    logseq.App.registerUIItem('toolbar', {
      key: 'logseq-plugin-agenda',
      template: '<a data-on-click="show" class="button"><i class="ti ti-comet"></i></a>',
    })

    // ========== todoist =========
    if (todoist?.token) {
      logseq.App.registerUIItem('toolbar', {
        key: 'plugin-agenda-todoist',
        template: '<a data-on-click="pullTodoistTasks" class="button"><i class="ti ti-chevrons-down"></i></a>',
      })
      getTodoistInstance()

      logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
        // console.log('[faiz:] === mian DB.onChanged', blocks, txData, txMeta)
        const syncToTodoist = async (uuid: string) => {
          const block = await logseq.Editor.getBlock(uuid)
          const event = await transformBlockToEvent(block!, getInitalSettings())
          console.info('[faiz:] === sync block to todoist', event)

          const todoistId = event.properties?.todoistId
          try {
            const task = await getTask(todoistId)
            const priority = findKey(PRIORITY_MAP, v => v === event.priority)
            let params: UpdateTaskArgs = { content: event.addOns.contentWithoutTime?.split('\n')?.[0], priority }
            if (event.addOns.allDay === true) params.dueDate = dayjs(event.addOns.start).format('YYYY-MM-DD')
            if (event.addOns.allDay === false) params.dueDatetime = dayjs.utc(event.addOns.start).format()
            if (event.addOns.status === 'done' && task?.completed === false) return closeTask(todoistId)
            if (event.addOns.status !== 'done' && task?.completed === true) return reopenTask(todoistId)
            updateTask(todoistId, params)
          } catch (error) {
            if ((error as TodoistRequestError).httpStatusCode === 404) {
              return logseq.App.showMsg(`Sync Error\nmessage: ${(error as TodoistRequestError)?.responseData}\nPlease check whether the task has been deleted or whether the todoist-id is correct`, 'error')
            }
          }
        }
        genDBTaskChangeCallback(syncToTodoist)?.({ blocks, txData, txMeta })
      })

      logseq.Editor.registerBlockContextMenuItem('Agenda: Upload to todoist', async ({ uuid }) => {
        const settings = getInitalSettings()
        const { todoist } = settings
        const block = await logseq.Editor.getBlock(uuid)
        if (!block?.marker) return logseq.App.showMsg('This block is not a task', 'error')
        if (block?.properties?.todoistId) return logseq.App.showMsg('This task has already been uploaded,\nplease do not upload it again', 'error')
        const event = await transformBlockToEvent(block!, settings)

        let params: AddTaskArgs = { content: event.addOns.contentWithoutTime?.split('\n')?.[0] }
        if (event.addOns.allDay === true) params.dueDate = dayjs(event.addOns.start).format('YYYY-MM-DD')
        if (event.addOns.allDay === false) params.dueDatetime = dayjs.utc(event.addOns.start).format()
        if (todoist?.project) params.projectId = todoist.project
        if (todoist?.label) params.labelIds = [todoist.label]
        createTask(params)
          ?.then(async task => {
            await updateBlock(event, task)
            return logseq.App.showMsg('Upload task to todoist success')
          })
          .catch(err => {
            logseq.App.showMsg('Upload task to todoist failed', 'error')
            console.error('[faiz:] === Upload task to todoist failed', err)
          })

      })
    }
    // ========== todoist ==============

    logseq.App.registerCommandPalette({
      key: 'logseq-plugin-agenda:show',
      label: 'Show Agenda',
    }, data => {
      renderApp()
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
    logseq.App.registerPageMenuItem('Agenda: Add this page to agenda project', ({ page }) => {
      const originalProjectList = logseq.settings?.projectList || []
      if (originalProjectList.find(project => project.id === page)) return logseq.App.showMsg('This Page is already in agenda project', 'warning')
      const newProject = {
        ...DEFAULT_PROJECT,
        id: page,
      }
      // hack https://github.com/logseq/logseq/issues/4447
      logseq.updateSettings({projectList: 1})
      // ensure subscription list is array
      logseq.updateSettings({ ...logseq.settings, projectList: originalProjectList.concat(newProject)})
      logseq.App.showMsg('Successfully added')
    })
    logseq.Editor.registerBlockContextMenuItem('Agenda: Modify Schedule', editSchedule)
    logseq.Editor.registerBlockContextMenuItem('Agenda: Start Pomodoro Timer', async ({ uuid }) => {
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
      if (args?.[0] !== 'agenda') return
      if (args?.[1] === 'task-list') {
        const renderered = parent.document.getElementById(slot)?.childElementCount
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
        const id = `agenda-pomodoro-timer-${slot}`
        logseq.provideUI({
          key: `agenda-${slot}`,
          slot,
          reset: true,
          template: `<div id="${id}"></div>`,
          // style: {},
        })
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

async function renderApp() {
  window.currentApp = 'app'
  togglePomodoro(false)
  toggleAppTransparent(false)
  let defaultRoute = ''
  const page = await logseq.Editor.getCurrentPage()
  const { projectList = [] } = getInitalSettings()
  if (projectList.some(project => Boolean(project.id) && project.id === page?.originalName)) defaultRoute = `project/${encodeURIComponent(page?.originalName)}`
  ReactDOM.render(
    <React.StrictMode>
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
