import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { genTaskBlockContent, genTaskTimeInfoText, genTaskTimeLinkText } from '../task'

describe('util/task.ts', () => {
  describe('genTaskTimeInfoText', () => {
    test('date mode no time', () => {
      const start = dayjs('2023-01-01')
      const end = dayjs('2023-01-01')
      expect(genTaskTimeInfoText(start, end, true)).toEqual('2023-01-01')
    })
    test('date mode with time', () => {
      const start = dayjs('2023-01-01 12:00')
      const end = dayjs('2023-01-01 13:00')
      expect(genTaskTimeInfoText(start, end, false)).toEqual('2023-01-01 12:00 - 13:00')
    })
    test('range mode no time', () => {
      const start = dayjs('2023-01-01')
      const end = dayjs('2023-01-03')
      expect(genTaskTimeInfoText(start, end, true)).toEqual('2023-01-01 - 2023-01-03')
    })
    test('range mode with time', () => {
      const start = dayjs('2023-01-01 12:00')
      const end = dayjs('2023-01-03 13:00')
      expect(genTaskTimeInfoText(start, end, false)).toEqual('2023-01-01 12:00 - 2023-01-03 13:00')
    })
  })

  describe('genTaskTimeLinkText', () => {
    const start = dayjs('2023-01-01 12:00')
    const sameDayEnd = dayjs('2023-01-01 13:00')
    const notSameDayEnd = dayjs('2023-01-03 13:00')
    test('markdown: date mode no time', () => {
      expect(
        genTaskTimeLinkText(
          {
            start,
            end: sameDayEnd,
            isAllDay: true,
          },
          'markdown',
        ),
      ).toEqual(`>[2023-01-01](#agenda://?start=${start.valueOf()}&end=${sameDayEnd.valueOf()})`)
    })
    test('org: date mode no time', () => {
      expect(
        genTaskTimeLinkText(
          {
            start,
            end: sameDayEnd,
            isAllDay: true,
          },
          'org',
        ),
      ).toEqual(`>[[#agenda://?start=${start.valueOf()}&end=${sameDayEnd.valueOf()}][2023-01-01]]`)
    })
    test('markdown: date mode with time', () => {
      expect(
        genTaskTimeLinkText(
          {
            start,
            end: sameDayEnd,
            isAllDay: false,
          },
          'markdown',
        ),
      ).toEqual(
        `>[2023-01-01 12:00 - 13:00](#agenda://?start=${start.valueOf()}&end=${sameDayEnd.valueOf()}&allDay=false)`,
      )
    })
    test('markdown: range mode no time', () => {
      expect(
        genTaskTimeLinkText(
          {
            start,
            end: notSameDayEnd,
            isAllDay: true,
          },
          'markdown',
        ),
      ).toEqual(`>[2023-01-01 - 2023-01-03](#agenda://?start=${start.valueOf()}&end=${notSameDayEnd.valueOf()})`)
    })
    test('markdown: range mode with time', () => {
      expect(
        genTaskTimeLinkText(
          {
            start,
            end: notSameDayEnd,
            isAllDay: false,
          },
          'markdown',
        ),
      ).toEqual(
        `>[2023-01-01 12:00 - 2023-01-03 13:00](#agenda://?start=${start.valueOf()}&end=${notSameDayEnd.valueOf()}&allDay=false)`,
      )
    })
  })

  describe('genTaskBlockContent', () => {
    const taskName = 'task content'
    const startDate = dayjs('2023-01-01')
    const endDate = dayjs('2023-01-01')
    test('markdown: date mode no time, priority A', () => {
      expect(
        genTaskBlockContent(
          {
            taskName,
            timeInfo: {
              start: startDate,
              end: endDate,
              isAllDay: true,
            },
            priority: 'A',
          },
          'markdown',
        ),
      ).toEqual(`TODO [#A] ${taskName} >[2023-01-01](#agenda://?start=${startDate.valueOf()}&end=${endDate.valueOf()})`)
    })
    test('markdown: date mode no time, no priority', () => {
      expect(
        genTaskBlockContent(
          {
            taskName,
            timeInfo: {
              start: startDate,
              end: endDate,
              isAllDay: true,
            },
            priority: undefined,
          },
          'markdown',
        ),
      ).toEqual(`TODO ${taskName} >[2023-01-01](#agenda://?start=${startDate.valueOf()}&end=${endDate.valueOf()})`)
    })
  })
})
