import dayjs from 'dayjs'
import { afterEach, describe, expect, test, vi } from 'vitest'

import type { AgendaTaskWithStart } from '@/types/task'

import { type BlockFromQuery, formatTaskTitle, transformBlockToAgendaEntity, separateTasksInDay } from '../task'

const DEMO_FAVORITE_PAGES = []
export const DEMO_BLOCK = {
  properties: {
    'agenda-color': 'blue',
  },
  scheduled: 20230924,
  parent: {
    id: 137,
  },
  id: 141,
  uuid: '65100e65-290a-46af-95c2-7b799a49db85',
  'path-refs': [
    {
      id: 4,
    },
    {
      id: 137,
    },
  ],
  content:
    'TODO test\nSCHEDULED: <2023-09-24 Sun 19:00>\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:',
  marker: 'TODO',
  page: {
    'journal-day': 20230924,
    'journal?': true,
    name: 'sep 24th, 2023',
    'original-name': 'Sep 24th, 2023',
    id: 137,
    uuid: '123123123-sep-24th-2023a',
    originalName: 'Sep 24th, 2023',
    journalDay: 20230924,
  },
  left: {
    id: 138,
  },
  format: 'markdown',
  refs: [
    {
      'journal?': false,
      name: 'todo',
      'original-name': 'TODO',
      id: 4,
      originalName: 'TODO',
      journalDay: 20230924,
    },
  ],
} as unknown as BlockFromQuery
export const DEMO_TASK = {
  id: '65100e65-290a-46af-95c2-7b799a49db85',
  status: 'todo',
  title: 'test',
  start: dayjs('2023-09-24 19:00', 'YYYYMMDD HH:mm'),
  end: undefined,
  allDay: false,
  deadline: undefined,
  estimatedTime: undefined,
  actualTime: 30,
  project: {
    originalName: 'Sep 24th, 2023',
    journalDay: 20230924,
    'journal?': true,
    'journal-day': 20230924,
    name: 'sep 24th, 2023',
    'original-name': 'Sep 24th, 2023',
    id: '123123123-sep-24th-2023a',
    uuid: '123123123-sep-24th-2023a',
    bgColor: '#2196f3',
    isFavorite: false,
    isJournal: true,
  },
  timeLogs: [
    {
      start: dayjs('2023-09-2419:30:00', 'YYYY-MM-DDHH:mm:ss'),
      end: dayjs('2023-09-2420:00:00', 'YYYY-MM-DDHH:mm:ss'),
      amount: 30,
    },
  ],
  subtasks: [],
  notes: [],
  rrule: undefined,
  doneHistory: [],
  rawBlock: DEMO_BLOCK,
} as unknown as AgendaTaskWithStart

describe('helper: task', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // TODO: 修复测试时没有 logseq 对象的问题
  // test('transformBlockToAgendaTask', async () => {
  //   expect(await transformBlockToAgendaTask(DEMO_BLOCK, { isInitialized: true })).toEqual(DEMO_TASK),
  //     DEMO_FAVORITE_PAGES
  // })
  test('separateTasksInDay', async () => {
    const tasks: AgendaTaskWithStart[] = [
      DEMO_TASK,
      {
        ...DEMO_TASK,
        start: dayjs('2023-09-25 19:00', 'YYYYMMDD HH:mm'),
        timeLogs: [
          {
            start: dayjs('2023-09-2519:30:00', 'YYYY-MM-DDHH:mm:ss'),
            end: dayjs('2023-09-2520:00:00', 'YYYY-MM-DDHH:mm:ss'),
            amount: 30,
          },
        ],
      },
    ]
    expect(separateTasksInDay(tasks)).toEqual(
      new Map([
        ['20230924', [tasks[0]]],
        ['20230925', [tasks[1]]],
      ]),
    )
  })

  test('resolves DB block UUIDs to their titles', async () => {
    const uuid = '6aa2306a-7998-4f41-bf1f-77a7381a2bea'
    vi.stubGlobal('logseq', {
      Editor: {
        getBlock: vi.fn().mockResolvedValue({ title: '👤 Roger Penrose' }),
        getPage: vi.fn(),
      },
    })

    await expect(formatTaskTitle(`Meeting with ${uuid}`, 'markdown')).resolves.toBe('Meeting with 👤 Roger Penrose')
  })

  test('resolves DB page UUIDs to their names when they are not blocks', async () => {
    const uuid = '6aa2306a-7998-4f41-bf1f-77a7381a2bea'
    vi.stubGlobal('logseq', {
      Editor: {
        getBlock: vi.fn().mockResolvedValue(null),
        getPage: vi.fn().mockResolvedValue({ originalName: '👤 Roger Penrose' }),
      },
    })

    await expect(formatTaskTitle(`Meeting with ${uuid}`, 'markdown')).resolves.toBe('Meeting with 👤 Roger Penrose')
  })
})
