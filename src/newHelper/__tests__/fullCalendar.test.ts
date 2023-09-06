import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import type { AgendaTaskWithStart } from '@/types/task'

import { minutesToHHmm, secondsToHHmmss, transformAgendaTaskToCalendarEvent } from '../fullCalendar'
import type { BlockFromQuery } from '../task'

const DEMO_BLOCK = {
  properties: {},
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
const DEMO_TASK = {
  id: '65100e65-290a-46af-95c2-7b799a49db85',
  status: 'todo',
  title: 'test',
  start: dayjs('2023-09-24 19:00', 'YYYYMMDD HH:mm'),
  allDay: false,
  deadline: undefined,
  estimatedTime: 30,
  actualTime: 30,
  project: {
    originalName: 'Sep 24th, 2023',
    journalDay: 20230924,
    'journal?': true,
    'journal-day': 20230924,
    name: 'sep 24th, 2023',
    'original-name': 'Sep 24th, 2023',
    id: 137,
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
  rawBlock: DEMO_BLOCK,
} as unknown as AgendaTaskWithStart

describe('helper: fullCalendar', () => {
  test('transformAgendaTaskToCalendarEvent', () => {
    const result = transformAgendaTaskToCalendarEvent(DEMO_TASK)
    expect(result).toEqual({
      id: DEMO_TASK.id,
      title: DEMO_TASK.title,
      allDay: DEMO_TASK.allDay,
      start: DEMO_TASK.start.toDate(),
      end: DEMO_TASK.start.add(DEMO_TASK.estimatedTime as number, 'minute').toDate(),
      rrule: DEMO_TASK.rrule,
      editable: true,
      extendedProps: DEMO_TASK,
    })
    expect(1).toBe(1)
  })
  test('minutesToHHmm', () => {
    expect(minutesToHHmm(68)).toBe('01:08')
  })
  test('secondsToHHmmss', () => {
    expect(secondsToHHmmss(800)).toBe('00:13:20')
  })
})
