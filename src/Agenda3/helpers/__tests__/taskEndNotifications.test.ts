import dayjs from 'dayjs'
import { afterEach, describe, expect, test, vi } from 'vitest'

import type { AgendaEntity } from '@/types/entity'

import { getAgendaEntities } from '../task'
import { getDueTaskEndNotifications } from '../taskEndNotifications'

const start = dayjs('2026-11-23T10:00:00')
const task = {
  id: 'task-1',
  title: 'A task',
  showTitle: 'A task',
  status: 'todo',
  start,
  allDay: false,
  estimatedTime: 30,
  project: {},
} as AgendaEntity
const end = start.add(30, 'minute').valueOf()

describe('scheduled task end notifications', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('reads the scheduled start and estimate from a Logseq block', async () => {
    const query = vi.fn().mockResolvedValue([
      [
        {
          uuid: 'task-1',
          marker: 'TODO',
          scheduled: 20261123,
          format: 'markdown',
          refs: [],
          content: 'TODO A task\nSCHEDULED: <2026-11-23 Mon 10:00>\n:AGENDA:\nestimated: 45m\n:END:',
          page: { uuid: 'page-1', 'original-name': 'Tasks', properties: {} },
        },
      ],
    ])
    vi.stubGlobal('logseq', {
      App: { getCurrentGraphFavorites: vi.fn().mockResolvedValue([]) },
      DB: { datascriptQuery: query },
    })
    const tasks = await getAgendaEntities({ isInitialized: true }, { scheduledIncompleteOnly: true })
    const expectedEnd = start.add(45, 'minute').valueOf()
    expect(getDueTaskEndNotifications(tasks, expectedEnd - 1, expectedEnd)).toEqual([
      { id: 'task-1', title: 'A task', end: expectedEnd },
    ])
    expect(query.mock.calls[0][0]).toContain('[?block :block/scheduled] [(not= ?marker "DONE")]')
    await getAgendaEntities({ isInitialized: true })
    expect(query.mock.calls[1][0]).not.toContain('[(not= ?marker "DONE")]')
  })
  test('fires at the end boundary, once, using the calendar duration', () => {
    expect(getDueTaskEndNotifications([task], end - 10_000, end - 1)).toEqual([])
    expect(getDueTaskEndNotifications([task], end - 10_000, end)).toEqual([{ id: task.id, title: task.title, end }])
    expect(getDueTaskEndNotifications([task], end, end + 10_000)).toEqual([])
  })

  test('uses the default 30 minutes, and honors changed estimates', () => {
    expect(getDueTaskEndNotifications([{ ...task, estimatedTime: undefined }], end - 1, end)).toHaveLength(1)
    expect(getDueTaskEndNotifications([{ ...task, estimatedTime: 45 }], end - 1, end)).toHaveLength(0)
    const newEnd = start.add(45, 'minute').valueOf()
    expect(getDueTaskEndNotifications([{ ...task, estimatedTime: 45 }], newEnd - 1, newEnd)).toHaveLength(1)
  })

  test('ignores completed, all-day, unscheduled, historical and invalid tasks', () => {
    const excluded = [
      { ...task, status: 'done' },
      { ...task, allDay: true },
      { ...task, start: undefined },
      { ...task, recurringPast: true },
      { ...task, estimatedTime: -1 },
      { ...task, estimatedTime: NaN },
      { ...task, start: dayjs('invalid') },
      { ...task, objective: {} },
    ] as AgendaEntity[]
    expect(getDueTaskEndNotifications(excluded, end - 60_000, end)).toEqual([])
  })

  test('notifies for each recurring occurrence without replaying old occurrences', () => {
    const recurring = { ...task, rrule: { freq: 'daily', interval: 1, dtstart: start.format() } } as AgendaEntity
    const tomorrowEnd = end + 24 * 60 * 60_000
    expect(getDueTaskEndNotifications([recurring], end - 1, end)).toHaveLength(1)
    expect(getDueTaskEndNotifications([recurring], tomorrowEnd - 1, tomorrowEnd)).toEqual([
      { id: task.id, title: task.title, end: tomorrowEnd },
    ])
  })

  test('handles simultaneous tasks and tasks spanning midnight', () => {
    expect(getDueTaskEndNotifications([task, { ...task, id: 'task-2' }], end - 1, end)).toHaveLength(2)
    const overnight = { ...task, start: dayjs('2026-11-23T23:45:00') }
    const overnightEnd = dayjs('2026-11-24T00:15:00').valueOf()
    expect(getDueTaskEndNotifications([overnight], overnightEnd - 1, overnightEnd)).toHaveLength(1)
  })
})
