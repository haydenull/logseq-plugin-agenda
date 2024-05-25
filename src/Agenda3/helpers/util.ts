import type { Dayjs } from 'dayjs'

/**
 * 计算两个日期之间的天数
 */
export const getDaysBetween = (start: Dayjs, end: Dayjs) => {
  const _start = start.startOf('day')
  const _end = end.startOf('day')
  return _end.diff(_start, 'day')
}
