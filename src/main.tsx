import '@logseq/libs'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'

const isDevelopment = import.meta.env.DEV

if (isDevelopment) {
  renderApp('browser')
} else {
  console.log('=== logseq-plugin-calendar loaded ===')
  logseq.ready(() => {

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
      key: 'logseq-plugin-calendar',
      template: '<a data-on-click="show" class="button"><i class="ti ti-window"></i></a>',
    })

    window.faizNavigate = (e) => {
      console.log('[faiz:] === faizNavigate', e)
    }

  })
}

function renderApp(env: string) {
  ReactDOM.render(
    <React.StrictMode>
      <App env={env} />
    </React.StrictMode>,
    document.getElementById('root')
  )
}
