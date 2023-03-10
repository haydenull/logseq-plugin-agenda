import React from 'react'
import ReactDOM from 'react-dom'
import { genToolbarPomodoro, togglePomodoro } from '@/helper/pomodoro'
import { toggleAppTransparent } from '@/util/util'
import PomodoroApp from '@/apps/PomodoroApp'

export function renderPomodoroApp(uuid: string) {
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

export function startPomodoro (uuid: string) {
  if (window?.currentPomodoro?.uuid !== uuid && window?.currentPomodoro?.state?.paused === false) return logseq.UI.showMsg('Another block is running pomodoro timer, please finish it first', 'error')
  logseq.App.registerUIItem('toolbar', {
    key: 'logseq-plugin-agenda-pomodoro',
    template: genToolbarPomodoro(uuid, '--:--', 0),
  })
  setTimeout(() => {
    renderPomodoroApp(uuid)
    logseq.showMainUI()
  }, 0)
}

const initializePomodoro = () => {
  window.unmountPomodoroApp = () => ReactDOM.unmountComponentAtNode(document.getElementById('pomodoro-root') as Element)
  window.interruptionMap = new Map()

  // @ts-ignore The requirement to return a void can be ignored
  logseq.Editor.registerBlockContextMenuItem('Agenda: Start Pomodoro Timer', async ({ uuid }) => {
    startPomodoro(uuid)
  })
}

export default initializePomodoro