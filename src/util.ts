import dayjs from "dayjs"
import { ISchedule } from "tui-calendar"

const DEFAULT_DATE_FORMAT = "YYYYMMDD"
const genCalendarDate = (date: number | string, format = DEFAULT_DATE_FORMAT) => {
  return dayjs(String(date), format).format()
}

export const getSchedules = async () => {
  console.log('[faiz:] === getSchedules start ===')
  let calendatSchedules:ISchedule[] = []
  // const calendarSchedulesMap = new Map()

  // Scheduled and Deadline
  const scheduledAndDeadlineBlocks = await logseq.DB.datascriptQuery(`
    [:find (pull ?block [*])
      :where
      (or
        [?block :block/scheduled ?d]
        [?block :block/deadline ?d])
      [(not= ?d "nil")]]
  `)
  calendatSchedules = calendatSchedules.concat(scheduledAndDeadlineBlocks.flat().map(block => {
    // calendarSchedulesMap.set(block.id, block)
    const scheduledString = block.content?.split('\n')?.find(l => l.startsWith('SCHEDULED:'))?.trim()
    const time = / \d{2}:\d{2}[ >]/.exec(scheduledString)?.[1] || ''
    if (block.deadline) {
      return {
        id: block.id,
        calendarId: 'journal',
        title: block.content,
        category: 'milestone',
        dueDateClass: '',
        start: genCalendarDate(block.deadline),
        isAllDay: false,
      }
    } else if (time) {
      return {
        id: block.id,
        calendarId: 'journal',
        title: block.content,
        category: 'time',
        dueDateClass: '',
        start: dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm').format(),
      }
    } else {
      return {
        id: block.id,
        calendarId: 'journal',
        title: block.content,
        category: 'allday',
        dueDateClass: '',
        start: genCalendarDate(block.scheduled),
        isAllDay: true,
      }
    }
  }))
  console.log('[faiz:] === scheduledAndDeadlineBlocks', scheduledAndDeadlineBlocks)


  // Tasks(logseq block's marker is not nil except scheduled and deadline)
  // const taskss = await logseq.DB.datascriptQuery(`
  //   [:find (pull ?block [*])
  //     :where
  //     [?block :block/marker ?marker]
  //     [?block :block/journal? true]
  //     [(not= ?marker "nil")]]
  // `)
  const tasks = await logseq.DB.q(`(and (task todo later now doing done))`)
  const _task = tasks?.filter(block => block?.page?.journalDay && !block.scheduled && !block.deadline) || []
  console.log('[faiz:] === tasks', _task)
  calendatSchedules = calendatSchedules.concat(_task?.map(block => {
    return {
      id: block.id,
      calendarId: 'journal',
      title: block.content,
      category: 'task',
      dueDateClass: '',
      start: genCalendarDate(block.page.journalDay),
    }
  }))

  // Daily Logs
  const keyword = logseq.settings?.logKey || 'Daily Log'
  const logs = await logseq.DB.q(`[[${keyword}]]`)
  const _logs = logs?.filter(block => {
    const _content = block.content?.trim()
    return _content.length > 0 && _content !== `[[${keyword}]]` && block?.page?.journalDay && !block.scheduled && !block.deadline
  }) || []
  console.log('[faiz:] === logs', _logs)
  calendatSchedules = calendatSchedules.concat(_logs?.map(block => {
    const date = block?.page?.journalDay
    const time = block.content?.substr(0, 5)
    const hasTime = time.split(':')?.filter(num => !Number.isNaN(Number(num)))?.length === 2
    return {
      id: block.id,
      calendarId: 'journal',
      title: block.content,
      category: hasTime ? 'time' : 'allday',
      dueDateClass: '',
      start: hasTime ? dayjs(date + ' ' + time, 'YYYYMMDD HH:mm').format() : genCalendarDate(date),
      // end: hasTime ? day(date + ' ' + time, 'YYYYMMDD HH:mm').add(1, 'hour').format() : day(date, 'YYYYMMDD').add(1, 'day').format(),
    }
  }))

  // const tasks = await logseq.DB.datascriptQuery(`
  //   [:find (pull ?b [*])
  //   :where
  //   [?b :block/marker ?m]
  //   [(not= ?m "nil")]]
  // `)


// SCHEDULED: <2022-02-20 Sun 10:04 .+1d>"
  // const tasks = await logseq.DB.q(`(and (todo now later done doing))`)
  // const validTasks = tasks?.filter(t => {
  //   return t?.page?.journalDay || t.deadline || t.scheduled
  // }).map(t => {
  //   if (t.scheduled) {
  //     const scheduledString = t.content?.split('\n').find(l => l.startsWith('SCHEDULED:')).trim()
  //     return {
  //       ...t,
  //       faizTime: / \d{2}:\d{2}[ >]/.exec(scheduledString)?.[1] || '',
  //     }
    // }
  //   return t
  // })
  // console.log('[faiz:] === tasks', validTasks)

  console.log('[faiz:] === calendatSchedules', calendatSchedules)
  return calendatSchedules
}

// export getScheduleCategory = (schedule: any, task?: boolean) => {
//   const categroy: string[] = []
//   if (schedule.deadline) categroy.push('milestone')
//   if (schedule.scheduled && schedule.faizTime) categroy.push('time')

// }