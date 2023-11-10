import type { AgendaTask } from '@/types/task'

export const navToLogseqBlock = (task: AgendaTask, currentGraph?: { name: string }) => {
  const uuid = task.recurringPast ? task.id.split('_')[0] : task.id
  if (import.meta.env.VITE_MODE === 'plugin') {
    logseq.Editor.scrollToBlockInPage(task.project.originalName, uuid)
    logseq.hideMainUI()
  } else {
    if (!currentGraph) return
    // example: logseq://graph/zio?block-id=65385ad5-f4e9-4423-8595-a5e4236cc8ad
    window.open(`logseq://graph/${currentGraph.name}?block-id=${uuid}`, '_blank')
  }
}
