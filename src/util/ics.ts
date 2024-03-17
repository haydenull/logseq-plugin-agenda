import type { Dayjs } from 'dayjs'
import { type EventAttributes } from 'ics'

import { getRRuleInstance } from '@/Agenda3/helpers/task'
import type { AgendaTaskWithStart } from '@/types/task'

export const transformAgendaTaskToICSEvent = (task: AgendaTaskWithStart, graphName: string): EventAttributes => {
  const { start, allDay, end, estimatedTime, project, rawBlock, showTitle } = task
  let common: Pick<EventAttributes, 'start' | 'title' | 'calName' | 'recurrenceRule' | 'productId' | 'description'> = {
    title: showTitle,
    start: genDateArray(start, allDay),
    calName: 'Agenda',
    productId: 'haydenull/ics',
    description: `project: ${project.originalName}\n\nLogseq Deep Link: logseq://graph/${graphName}?block-id=${rawBlock.uuid}`,
  } as const
  if (task.rrule) {
    const rruleInstance = getRRuleInstance(task.rrule)
    common = {
      ...common,
      recurrenceRule:
        rruleInstance
          .toString()
          .split('\n')
          .find((l) => l.startsWith('RRULE:'))
          ?.replace('RRULE:', '') || '',
    }
  }

  let type: 'day-event' | 'multi-days-event' | 'time-event' = 'day-event'
  if (allDay === false && estimatedTime !== undefined) {
    type = 'time-event'
  } else if (end) {
    type = 'multi-days-event'
  }

  switch (type) {
    case 'multi-days-event':
      return {
        ...common,
        end: genDateArray(end!.add(1, 'day'), allDay),
      }
    case 'time-event':
      return {
        ...common,
        duration: { minutes: estimatedTime },
      }
    case 'day-event':
      return {
        ...common,
        end: common.start,
      }
  }
}

function genDateArray(day: Dayjs, allDay: boolean): EventAttributes['start'] {
  const year = day.year()
  const month = day.month() + 1
  const date = day.date()
  const hour = day.hour()
  const minute = day.minute()
  return allDay ? [year, month, date] : [year, month, date, hour, minute]
}
