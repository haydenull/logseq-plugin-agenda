import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

import TaskListApp from '@/apps/TaskListApp'
import { LOGSEQ_PROVIDE_COMMON_STYLE } from '@/constants/style'

const initializeSidebar = () => {
  logseq.Editor.registerSlashCommand('Agenda: Insert Task List', async () => {
    logseq.Editor.insertAtEditingCursor(`{{renderer agenda, task-list}}`)
  })
  logseq.App.onMacroRendererSlotted(async ({ slot, payload: { arguments: args, uuid } }) => {
    if (args?.[0] !== 'agenda') return
    if (args?.[1] === 'task-list') {
      const rendered = parent.document.getElementById(slot)?.childElementCount
      if (rendered) return

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
        const root = createRoot(parent.document.getElementById(id)!)
        root.render(
          <React.StrictMode>
            <TaskListApp containerId={id} />
          </React.StrictMode>,
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
}

export default initializeSidebar
