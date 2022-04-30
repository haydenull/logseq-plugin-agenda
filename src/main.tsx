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
import { initializeSettings } from './util/baseInfo'
import App from './App'
import 'tui-calendar/dist/tui-calendar.css'
import './style/index.less'

dayjs.extend(weekday)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(localeData)
dayjs.extend(difference)
dayjs.extend(isBetween)

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

  })
}

function renderApp(env: string) {
  ReactDOM.render(
    <React.StrictMode>
      {/* <App env={env} /> */}
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  )
}
