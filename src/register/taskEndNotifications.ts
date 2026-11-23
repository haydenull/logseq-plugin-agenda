import { getAgendaEntities } from '@/Agenda3/helpers/task'
import { getDueTaskEndNotifications, type TaskEndNotification } from '@/Agenda3/helpers/taskEndNotifications'
import type { Settings } from '@/Agenda3/models/settings'

const POLL_INTERVAL = 10_000
const MAX_LATENESS = 5 * 60_000

export const showTaskEndNotification = (task: TaskEndNotification, graph: string) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  const notification = new Notification('Agenda — scheduled time ended', {
    body: task.title,
    tag: `agenda-task-end:${graph}:${task.id}:${task.end}`,
    silent: false,
    requireInteraction: true,
  })
  notification.onclick = async () => {
    notification.close()
    // Never navigate to a block in a different graph after a graph switch.
    if ((await logseq.App.getCurrentGraph())?.url === graph && task.id) {
      logseq.hideMainUI()
      logseq.App.pushState('page', { name: task.id })
    }
  }
  notification.onerror = () => console.error('[Agenda] Could not display the task-end notification.')
  return true
}

export const testTaskEndNotification = async () => {
  if (typeof Notification === 'undefined') return logseq.UI.showMsg('Desktop notifications are unavailable.', 'warning')
  if (Notification.permission === 'default') await Notification.requestPermission()
  const graph = await logseq.App.getCurrentGraph()
  if (
    !showTaskEndNotification(
      { id: '', title: 'Test notification — scheduled task alerts are ready.', end: Date.now() },
      graph?.url ?? '',
    )
  ) {
    logseq.UI.showMsg('Allow notifications for Logseq to receive task-end alerts.', 'warning')
  }
}

/** Lives outside React so alerts also work before Agenda is opened and while it is hidden. */
export const initializeTaskEndNotifications = () => {
  let lastCheck = Date.now()
  let graphUrl: string | undefined
  let generation = 0
  let stopped = false
  let timer: ReturnType<typeof setTimeout>
  const delivered = new Map<string, number>()

  const reset = () => {
    generation++
    graphUrl = undefined
    lastCheck = Date.now()
    delivered.clear()
  }
  const unsubscribe = logseq.App.onCurrentGraphChanged(reset)
  const unsubscribeSettings = logseq.onSettingsChanged<Settings>((settings, previousSettings) => {
    if ((settings.general?.notifyOnTaskEnd === true) !== (previousSettings.general?.notifyOnTaskEnd === true)) reset()
  })

  const check = async () => {
    const currentGeneration = generation
    try {
      const settings = logseq.settings as unknown as Settings
      if (
        settings?.general?.notifyOnTaskEnd !== true ||
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted'
      ) {
        lastCheck = Date.now()
        return
      }
      const graph = await logseq.App.getCurrentGraph()
      if (stopped || currentGeneration !== generation) return
      if (!graph) {
        reset()
        return
      }
      if (graphUrl !== graph.url) {
        graphUrl = graph.url
        lastCheck = Date.now()
      }
      // Filters only affect the view; hidden scheduled tasks still need their alerts.
      const entities = await getAgendaEntities({ ...settings, selectedFilters: [] }, { scheduledIncompleteOnly: true })
      if (stopped || currentGeneration !== generation) return
      if ((logseq.settings as unknown as Settings)?.general?.notifyOnTaskEnd !== true) return
      const now = Date.now()
      const since = Math.max(lastCheck, now - MAX_LATENESS)
      for (const [key, end] of delivered) if (end < now - MAX_LATENESS) delivered.delete(key)
      for (const task of getDueTaskEndNotifications(entities, since, now)) {
        const key = `${task.id}:${task.end}`
        if (!delivered.has(key) && showTaskEndNotification(task, graph.url)) delivered.set(key, task.end)
      }
      lastCheck = now
    } catch (error) {
      console.error('[Agenda] Could not check scheduled task end times:', error)
    } finally {
      if (!stopped) timer = setTimeout(check, POLL_INTERVAL)
    }
  }
  void check()
  return () => {
    stopped = true
    generation++
    clearTimeout(timer)
    unsubscribe()
    unsubscribeSettings()
  }
}
