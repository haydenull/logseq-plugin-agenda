import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { genDaysOfWeek } from '../util'

describe('util/util.ts', () => {
  describe('genDaysOfWeek', () => {
    test('should generate correct week days: start of day is Sunday', () => {
      const someoneDay = dayjs('2023-08-27') // Sunday
      const days = genDaysOfWeek(0, someoneDay)
      expect(days.map((day) => day.format('YYYY-MM-DD'))).toEqual([
        '2023-08-27', // Sunday
        '2023-08-28', // Monday
        '2023-08-29', // Tuesday
        '2023-08-30', // Wednesday
        '2023-08-31', // Thursday
        '2023-09-01', // Friday
        '2023-09-02', // Saturday
      ])
    })
    test('should generate correct week days: start of day is Monday', () => {
      const someoneDay = dayjs('2023-08-27') // Sunday
      const days = genDaysOfWeek(1, someoneDay)
      expect(days.map((day) => day.format('YYYY-MM-DD'))).toEqual([
        '2023-08-21', // Monday
        '2023-08-22', // Tuesday
        '2023-08-23', // Wednesday
        '2023-08-24', // Thursday
        '2023-08-25', // Friday
        '2023-08-26', // Saturday
        '2023-08-27', // Sunday
      ])
    })
  })
})
