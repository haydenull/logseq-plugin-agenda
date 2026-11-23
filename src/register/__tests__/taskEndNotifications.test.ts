import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { getAgendaEntities } from '@/Agenda3/helpers/task'
import type { Settings } from '@/Agenda3/models/settings'
import type { AgendaEntity } from '@/types/entity'

import { initializeTaskEndNotifications, testTaskEndNotification } from '../taskEndNotifications'

vi.mock('@/Agenda3/helpers/task', async () => ({
  ...(await vi.importActual<typeof import('@/Agenda3/helpers/task')>('@/Agenda3/helpers/task')),
  getAgendaEntities: vi.fn(),
}))

const start = dayjs('2026-11-23T10:00:00')
const task = {
  id: 'task-1',
  title: 'Task',
  showTitle: 'Task',
  status: 'todo',
  start,
  allDay: false,
  estimatedTime: 30,
  project: {},
} as AgendaEntity
const end = start.add(30, 'minute').valueOf()
let stop: (() => void) | undefined
let graphChanged: () => void
let notification: ReturnType<typeof vi.fn>
let unsubscribe: ReturnType<typeof vi.fn>
let unsubscribeSettings: ReturnType<typeof vi.fn>
let settingsChanged: (settings: Settings, previous: Settings) => void

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(end - 10_000)
  notification = vi.fn(function () {
    return { close: vi.fn() }
  })
  Object.assign(notification, { permission: 'granted', requestPermission: vi.fn().mockResolvedValue('granted') })
  vi.stubGlobal('Notification', notification)
  unsubscribe = vi.fn()
  unsubscribeSettings = vi.fn()
  vi.stubGlobal('logseq', {
    settings: { isInitialized: true, general: { notifyOnTaskEnd: true }, selectedFilters: ['hidden'] },
    onSettingsChanged: vi.fn((handler) => {
      settingsChanged = handler
      return unsubscribeSettings
    }),
    App: {
      getCurrentGraph: vi.fn().mockResolvedValue({ url: 'graph-a' }),
      onCurrentGraphChanged: vi.fn((handler) => {
        graphChanged = handler
        return unsubscribe
      }),
      pushState: vi.fn(),
    },
    UI: { showMsg: vi.fn() },
    hideMainUI: vi.fn(),
  })
  vi.mocked(getAgendaEntities).mockReset().mockResolvedValue([task])
})

afterEach(() => {
  stop?.()
  stop = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const launch = async () => {
  stop = initializeTaskEndNotifications()
  await vi.advanceTimersByTimeAsync(0)
}

describe('background task-end notifications', () => {
  test('works without mounting Agenda, emits sound, and does not repeat', async () => {
    await launch()
    expect(notification).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).toHaveBeenCalledWith(
      'Agenda — scheduled time ended',
      expect.objectContaining({
        body: 'Task',
        silent: false,
        requireInteraction: true,
      }),
    )
    expect(getAgendaEntities).toHaveBeenCalledWith(expect.objectContaining({ selectedFilters: [] }), {
      scheduledIncompleteOnly: true,
    })
    await vi.advanceTimersByTimeAsync(30_000)
    expect(notification).toHaveBeenCalledTimes(1)
  })

  test('does not replay overdue tasks on startup or reload', async () => {
    vi.setSystemTime(end + 1)
    await launch()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).not.toHaveBeenCalled()
  })

  test('refreshes completion, deletion and rescheduling before alerting', async () => {
    await launch()
    vi.mocked(getAgendaEntities).mockResolvedValue([{ ...task, status: 'done' }])
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).not.toHaveBeenCalled()
    vi.mocked(getAgendaEntities).mockResolvedValue([{ ...task, estimatedTime: 31 }])
    await vi.advanceTimersByTimeAsync(60_000)
    expect(notification).toHaveBeenCalledTimes(1)
    vi.mocked(getAgendaEntities).mockResolvedValue([])
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).toHaveBeenCalledTimes(1)
  })

  test('respects disable and notification permission', async () => {
    logseq.settings!.general = { notifyOnTaskEnd: false }
    await launch()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(getAgendaEntities).not.toHaveBeenCalled()
    expect(notification).not.toHaveBeenCalled()
    await testTaskEndNotification()
    expect(notification).toHaveBeenCalledTimes(1)
    Object.assign(notification, { permission: 'denied' })
    await testTaskEndNotification()
    expect(logseq.UI.showMsg).toHaveBeenCalledWith(expect.stringContaining('Allow notifications'), 'warning')
  })

  test('requires opt-in and does not replay tasks that ended before enabling', async () => {
    logseq.settings!.general = {}
    await launch()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(getAgendaEntities).not.toHaveBeenCalled()
    const previous = logseq.settings as unknown as Settings
    logseq.settings = { ...logseq.settings!, general: { notifyOnTaskEnd: true } }
    settingsChanged(logseq.settings as unknown as Settings, previous)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(getAgendaEntities).toHaveBeenCalled()
    expect(notification).not.toHaveBeenCalled()
  })

  test('does not query tasks when desktop notifications are unavailable or denied', async () => {
    Object.assign(notification, { permission: 'denied' })
    await launch()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(getAgendaEntities).not.toHaveBeenCalled()
    expect(notification).not.toHaveBeenCalled()
    vi.stubGlobal('Notification', undefined)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(getAgendaEntities).not.toHaveBeenCalled()
  })

  test('opens the task only in its original graph', async () => {
    await launch()
    await vi.advanceTimersByTimeAsync(10_000)
    const toast = notification.mock.results[0].value
    await toast.onclick()
    expect(logseq.App.pushState).toHaveBeenCalledWith('page', { name: task.id })
    vi.mocked(logseq.App.pushState).mockClear()
    vi.mocked(logseq.App.getCurrentGraph).mockResolvedValue({ url: 'graph-b' } as never)
    await toast.onclick()
    expect(logseq.App.pushState).not.toHaveBeenCalled()
  })

  test('does not deliver an in-flight result after being disabled', async () => {
    let resolve!: (tasks: AgendaEntity[]) => void
    vi.mocked(getAgendaEntities).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      }),
    )
    await launch()
    vi.setSystemTime(end)
    const previous = logseq.settings as unknown as Settings
    logseq.settings = { ...logseq.settings!, general: { notifyOnTaskEnd: false } }
    settingsChanged(logseq.settings as unknown as Settings, previous)
    resolve([task])
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).not.toHaveBeenCalled()
  })

  test('discards an in-flight response from a previous graph', async () => {
    let resolve!: (tasks: AgendaEntity[]) => void
    vi.mocked(getAgendaEntities).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      }),
    )
    await launch()
    vi.setSystemTime(end)
    graphChanged()
    vi.mocked(logseq.App.getCurrentGraph).mockResolvedValue({ url: 'graph-b' } as never)
    resolve([task])
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).not.toHaveBeenCalled()
  })

  test('recovers from transient failures and ignores a long sleep backlog', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await launch()
    vi.mocked(getAgendaEntities).mockRejectedValueOnce(new Error('Graph busy'))
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).toHaveBeenCalledTimes(1)
    stop!()
    vi.setSystemTime(end - 10_000)
    await launch()
    vi.setSystemTime(end + 60 * 60_000)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(notification).toHaveBeenCalledTimes(1)
  })

  test('unloading cancels polling and unsubscribes', async () => {
    await launch()
    stop!()
    stop = undefined
    await vi.advanceTimersByTimeAsync(60_000)
    expect(notification).not.toHaveBeenCalled()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(unsubscribeSettings).toHaveBeenCalledTimes(1)
  })
})
