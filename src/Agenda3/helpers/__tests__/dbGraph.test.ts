import { afterEach, describe, expect, test, vi } from 'vitest'

import { DEFAULT_SETTINGS } from '@/Agenda3/models/settings'

import {
  createDbTask,
  getDbDateValue,
  getDbScalarValue,
  getDbTaskStatus,
  isCanceledDbStatus,
  isCompletedDbStatus,
} from '../dbGraph'
import { getAgendaEntities } from '../task'

describe('DB graph properties', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('reads dates and scalar properties by namespaced or plain key', () => {
    const timestamp = new Date('2024-03-18T12:30:00.000Z').valueOf()
    const properties = {
      'logseq.property/scheduled': { value: timestamp },
      agenda3_estimated_time: 45,
    }

    expect(getDbDateValue(properties, 'logseq.property/scheduled')?.valueOf()).toBe(timestamp)
    expect(getDbScalarValue(properties, 'agenda3_estimated_time')).toBe(45)
  })

  test('reads native status property values without querying closed-value entities', () => {
    expect(getDbTaskStatus({ 'logseq.property/status': 'Todo' })).toBe('Todo')
    expect(getDbTaskStatus({ 'logseq.property/status': { title: 'Done' } })).toBe('Done')
    expect(isCompletedDbStatus('Done')).toBe(true)
    expect(isCompletedDbStatus(':logseq.property/status.done')).toBe(true)
    expect(isCanceledDbStatus('Cancelled')).toBe(true)
    expect(getDbTaskStatus(null)).toBeUndefined()
  })

  test('creates a tagged DB task with its Todo status', async () => {
    const block = { uuid: 'task-uuid', page: { id: 5 } }
    const editor = {
      getTodayPage: vi.fn().mockResolvedValue({ id: 5, uuid: 'journal-uuid' }),
      getTag: vi.fn().mockResolvedValue({ id: 10, uuid: 'task-tag-uuid' }),
      appendBlockInPage: vi.fn().mockResolvedValue(block),
      upsertProperty: vi.fn().mockResolvedValue(undefined),
      addBlockTag: vi.fn().mockResolvedValue(undefined),
      upsertBlockProperty: vi.fn().mockResolvedValue(undefined),
      removeBlockProperty: vi.fn().mockResolvedValue(undefined),
      getBlock: vi.fn().mockResolvedValue(block),
      removeBlock: vi.fn().mockResolvedValue(undefined),
    }
    vi.stubGlobal('logseq', { Editor: editor })

    await expect(createDbTask({ title: '  DB task  ' })).resolves.toEqual(block)

    expect(editor.appendBlockInPage).toHaveBeenCalledWith('journal-uuid', 'DB task')
    expect(editor.addBlockTag).toHaveBeenCalledWith('task-uuid', 'task-tag-uuid')
    expect(editor.upsertBlockProperty).toHaveBeenCalledWith('task-uuid', 'logseq.property/status', 'Todo')
  })

  test('returns an empty task list without requiring status choices when no tasks exist', async () => {
    const datascriptQuery = vi.fn().mockResolvedValue([])
    vi.stubGlobal('logseq', {
      DB: { datascriptQuery },
      Editor: {
        getTag: vi.fn().mockResolvedValue({ id: 10 }),
      },
    })

    await expect(getAgendaEntities(DEFAULT_SETTINGS)).resolves.toEqual([])
    expect(datascriptQuery).toHaveBeenCalledTimes(1)
  })
})
