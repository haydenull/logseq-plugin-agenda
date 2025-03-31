import type { Dayjs } from 'dayjs'

import type { AgendaEntity } from '@/types/entity'

/**
 * 计算两个日期之间的天数
 */
export const getDaysBetween = (start: Dayjs, end: Dayjs) => {
  const _start = start.startOf('day')
  const _end = end.startOf('day')
  return _end.diff(_start, 'day')
}

export function selectTaskColor(groupType: string, task: AgendaEntity) {
  return !task?.filters?.[0]?.alwaysEnabled && groupType === 'page' ? task.project.bgColor : task?.filters?.[0]?.color
}
