import type { AppUserConfigs } from '@logseq/libs/dist/LSPlugin'
import { type Dayjs } from 'dayjs'

import { type PriorityValue } from '@/components/TaskModal'
import { DATE_FORMATTER, DATE_TIME_FORMATTER } from '@/constants/agenda'

/**
 * generate task's time info
 * date mode: 2023-01-01
 * date mode with time: 2023-01-01 12:00 - 13:00
 * range mode: 2023-01-01 - 2023-01-03
 * range mode with time: 2023-01-01 12:00 - 2023-01-03 13:00
 */
export const genTaskTimeInfoText = (start: Dayjs, end: Dayjs, allDay: boolean) => {
  const isSingleDayTask = start.isSame(end, 'day')
  const isAllDay = allDay

  // date mode
  if (isSingleDayTask) {
    if (isAllDay) {
      return start.format('YYYY-MM-DD')
    } else {
      const startText = start.format('YYYY-MM-DD HH:mm')
      const endText = end.format('HH:mm')
      return startText + ' - ' + endText
    }
  }

  // range mode
  if (isAllDay) {
    return start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD')
  } else {
    const startText = start.format('YYYY-MM-DD HH:mm')
    const endText = end.format('YYYY-MM-DD HH:mm')
    return startText + ' - ' + endText
  }
}

export const genTaskTimeLinkText = (
  {
    start,
    end,
    isAllDay = true,
  }: {
    start: Dayjs
    end: Dayjs
    isAllDay?: boolean
  },
  logseqFormat: AppUserConfigs['preferredFormat'] = 'markdown',
) => {
  const url = new URL('agenda://')
  url.searchParams.append('start', '' + start.valueOf())
  url.searchParams.append('end', '' + end.valueOf())
  if (isAllDay === false) url.searchParams.append('allDay', 'false')

  const startText = isAllDay ? start.format(DATE_FORMATTER) : start.format(DATE_TIME_FORMATTER)
  let endText = isAllDay ? end.format(DATE_FORMATTER) : end.format(DATE_TIME_FORMATTER)

  const isSingleDayTask = start.isSame(end, 'day')
  if (isSingleDayTask && isAllDay) endText = ''
  if (isSingleDayTask && !isAllDay) endText = end.format('HH:mm')

  const showText = startText + (endText ? ` - ${endText}` : '')
  const time = logseqFormat === 'org' ? `>[[#${url.toString()}][${showText}]]` : `>[${showText}](#${url.toString()})`

  return time
}

/**
 * generate journal task block content
 */
export const genTaskBlockContent = (
  {
    taskName,
    timeInfo,
    priority,
  }: {
    taskName: string
    timeInfo: { start: Dayjs; end: Dayjs; isAllDay?: boolean }
    priority?: PriorityValue
  },
  logseqFormat: AppUserConfigs['preferredFormat'] = 'markdown',
) => {
  let text = 'TODO'
  if (priority) text += ` [#${priority}]`
  text += ` ${taskName}`
  const timeLinkText = genTaskTimeLinkText(timeInfo, logseqFormat)
  text += ` ${timeLinkText}`

  return text
}
