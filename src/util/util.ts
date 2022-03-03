import dayjs from 'dayjs'
import { flattenDeep, get } from 'lodash'
import en from 'dayjs/locale/en'
import { ISchedule } from 'tui-calendar'
import { DEFAULT_BLOCK_DEADLINE_DATE_FORMAT, DEFAULT_JOURNAL_FORMAT, DEFAULT_LOG_KEY, DEFAULT_SETTINGS, SHOW_DATE_FORMAT } from './constants'

dayjs.locale({
  ...en,
  weekStart: 1,
})


const genCalendarDate = (date: number | string, format = DEFAULT_BLOCK_DEADLINE_DATE_FORMAT) => {
  return dayjs(String(date), format).format()
}

export type ISettingsFormQuery = Partial<{
  script: string
  scheduleStart: string
  scheduleEnd: string
  dateFormatter: string
  isMilestone: boolean
}>
export type ISettingsForm = {
  defaultView: string
  weekStartDay: 0 | 1
  journalDateFormatter: string
  logKey: string
  calendarList: {
    id: string
    bgColor: string
    textColor: string
    borderColor: string
    enabled: boolean
    query: ISettingsFormQuery[]
  }[]
}
export const getInitalSettings = (): ISettingsForm => {
  return {
    ...DEFAULT_SETTINGS,
    ...logseq.settings,
  }
}

type IQueryWithCalendar = {
  calendarConfig: ISettingsForm['calendarList'][number]
  query: ISettingsFormQuery
}
export const getSchedules = async () => {
  const testQuery = `
  [:find
    (pull
     ?block
     [:db/id
      :block/uuid
      :block/parent
      :block/left
      :block/collapsed?
      :block/format
      :block/_refs
      :block/path-refs
      :block/tags
      :block/content
      :block/marker
      :block/priority
      :block/properties
      :block/pre-block?
      :block/scheduled
      :block/deadline
      :block/repeated?
      :block/created-at
      :block/updated-at
      :block/file
      :block/heading-level
      {:block/refs
        [:db/id :block/name :block/original-name :block/journal-day :block/journal?]}
      {:block/page
       [:db/id :block/name :block/original-name :block/journal-day :block/journal?]}
      {:block/_parent ...}])
    :where
    [?page :block/name ?name]
    [?block :block/page ?page]
    (not [(contains? #{"高中教务系统"} ?name)])]
  `
  const test = await logseq.DB.datascriptQuery(testQuery)
  console.log('[faiz:] === test', testQuery, test)

  console.log('[faiz:] === getSchedules start ===', logseq.settings, getInitalSettings())
  let calendarSchedules:ISchedule[] = []

  // get calendar configs
  const { calendarList: calendarConfigs = [], logKey } = getInitalSettings()
  console.log('[faiz:] === calendarConfigs', calendarConfigs)
  const customCalendarConfigs = calendarConfigs.filter(config => config.enabled)

  let scheduleQueryList: IQueryWithCalendar[] = []

  scheduleQueryList = customCalendarConfigs.map((calendar) => {
    return calendar?.query
            ?.filter(item => item?.script?.length)
            ?.map(item => ({
              calendarConfig: calendar,
              query: item,
            }))
  }).filter(Boolean).flat()

  const queryPromiseList = scheduleQueryList.map(async queryWithCalendar => {
    const { calendarConfig, query } = queryWithCalendar
    const { script = '', scheduleStart = '', scheduleEnd = '', dateFormatter, isMilestone } = query
    const blocks = await logseq.DB.datascriptQuery(script)
    console.log('[faiz:] === search blocks by query: ', script, blocks)

    return flattenDeep(blocks).map(block => {

      const start = get(block, scheduleStart, undefined)
      const end = get(block, scheduleEnd, undefined)
      let hasTime = /[Hhm]+/.test(dateFormatter || '')

      let _start = start && genCalendarDate(start, dateFormatter)
      let _end = end && genCalendarDate(end, dateFormatter)
      if (start && ['scheduled', 'deadline'].includes(scheduleStart)) {
        const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleStart}:`))?.trim()
        const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
        if (time) {
          _start = dayjs(`${start} ${time}`, 'YYYYMMDD HH:mm').format()
          hasTime = true
        }
      }
      if (end && ['scheduled', 'deadline'].includes(scheduleEnd)) {
        const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleEnd}:`))?.trim()
        const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
        if (time) {
          _end = dayjs(`${end} ${time}`, 'YYYYMMDD HH:mm').format()
          hasTime = true
        }
      }

      let _category: ICategory = hasTime ? 'time' : 'allday'
      if (isMilestone) _category = 'milestone'
      if (!isMilestone && isOverdue(block, end || start)) _category = 'task'


      return genSchedule({
        blockData: block,
        category: _category,
        start: _start,
        end: _end,
        calendarConfig,
      })

    })
  })

  const scheduleRes = await Promise.all(queryPromiseList)
  calendarSchedules = flattenDeep(calendarSchedules.concat(scheduleRes))

  // TODO: 同步执行
    // schedule.forEach(async (scheduleConfig, index) => {
    //   const { script = '', scheduleStart = '', scheduleEnd = '', dateFormatter } = scheduleConfig
    //   if (script.length > 0) {
    //     const blocks = await logseq.DB.datascriptQuery(script)
    //     console.log('[faiz:] === schedule blocks', index, blocks)
    //     calendarSchedules.concat(flattenDeep(blocks).map(block => {

    //       const start = get(block, scheduleStart, undefined)
    //       const end = get(block, scheduleEnd, undefined)
    //       let hasTime = /[HhMm]+/.test(dateFormatter || '')

    //       let _start = start && genCalendarDate(start, dateFormatter)
    //       let _end = end && genCalendarDate(end, dateFormatter)
    //       if (start && ['scheduled', 'deadline'].includes(scheduleStart)) {
    //         const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleStart}:`))?.trim()
    //         const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
    //         if (time) {
    //           _start = dayjs(`${start} ${time}`, 'YYYYMMDD HH:mm').format()
    //           hasTime = true
    //         }
    //       }
    //       if (end && ['scheduled', 'deadline'].includes(scheduleEnd)) {
    //         const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleEnd}:`))?.trim()
    //         const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
    //         if (time) {
    //           _end = dayjs(`${end} ${time}`, 'YYYYMMDD HH:mm').format()
    //           hasTime = true
    //         }
    //       }

    //       let _category: 'time' | 'allday' | 'task' | 'milestone' = hasTime ? 'time' : 'allday'
    //       if (isOverdue(block, end || start)) _category = 'task'


    //       return genSchedule({
    //         blockData: block,
    //         category: _category,
    //         start: _start,
    //         end: _end,
    //         calendarConfig: calendar,
    //       })

    //     }))
    //   }
    // })
  // })




//   const journalCalendar = calendarConfigs.find(calendar => calendar.id === 'journal')
//   const customCalendarConfigs = calendarConfigs.filter(calendar => calendar.id !== 'journal' && calendar.enabled)
//   const customCalendarPromises = await Promise.all(customCalendarConfigs.map(calendar => logseq.Editor.getPage(calendar.id)))
//   const _customCalendarConfigs = customCalendarPromises?.map((pageData, index) => {
//                                 const pageId = pageData?.id
//                                 return { ...customCalendarConfigs[index], pageId }
//                               })
// const _calendarConfigs = journalCalendar ? [journalCalendar, ..._customCalendarConfigs] : _customCalendarConfigs
//   console.log('[faiz:] === customCalendarConfigs', _calendarConfigs)

//   // Scheduled and Deadline
//   const scheduledAndDeadlineBlocks = await logseq.DB.datascriptQuery(`
//     [:find (pull ?block [*])
//       :where
//       (or
//         [?block :block/scheduled ?d]
//         [?block :block/deadline ?d])
//       [(not= ?d "nil")]]
//   `)
//   console.log('[faiz:] === scheduledAndDeadlineBlocks', scheduledAndDeadlineBlocks)
//   calendarSchedules = calendarSchedules.concat(scheduledAndDeadlineBlocks.flat().map(block => {
//     const scheduledString = block.content?.split('\n')?.find(l => l.startsWith('SCHEDULED:'))?.trim()
//     const time = / (\d{2}:\d{2})[ >]/.exec(scheduledString)?.[1] || ''
//     // TODO: show overdue deadline and not done scheduled
//     if (block.deadline) {
//       // DEADLINE
//       return genSchedule({
//         blockData: block,
//         category: isOverdue(block, block.deadline) ? 'task' : 'allday',
//         start: genCalendarDate(block.deadline),
//         calendarConfigs: _calendarConfigs,
//       })
//     } else if (time) {
//       // SCHEDULED with time
//       return genSchedule({
//         blockData: block,
//         category: isOverdue(block, block.scheduled) ? 'task' : 'time',
//         start: dayjs(`${block.scheduled} ${time}`, 'YYYYMMDD HH:mm').format(),
//         calendarConfigs: _calendarConfigs,
//       })
//     } else {
//       // SCHEDULED without time
//       return genSchedule({
//         blockData: block,
//         category: isOverdue(block, block.scheduled) ? 'task' : 'allday',
//         start: genCalendarDate(block.scheduled),
//         calendarConfigs: _calendarConfigs,
//         isAllDay: true,
//       })
//     }
//   }))


//   // Tasks(tasks in journal but without scheduled or deadline)
//   const tasks = await logseq.DB.q(`(and (task todo later now doing done))`)
//   const _task = tasks?.filter(block => block?.page?.journalDay && !block.scheduled && !block.deadline) || []
//   console.log('[faiz:] === tasks', _task)
//   calendarSchedules = calendarSchedules.concat(_task?.map(block => {
//     return genSchedule({
//       blockData: block,
//       category: isOverdue(block, block.page.journalDay) ? 'task' : 'allday',
//       start: genCalendarDate(block.page.journalDay),
//       calendarConfigs: _calendarConfigs,
//       isJournal: true,
//     })
//   }))

  // Daily Logs
  // TODO: support end time
  if (logKey) {
    const logs = await logseq.DB.q(`[[${logKey}]]`)
    const _logs = logs
                  ?.filter(block => block.content?.trim() === `[[${logKey}]]`)
                  ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                  ?.flat()
                  ?.filter(block => {
                    const _content = block.content?.trim()
                    return _content.length > 0 && block?.page?.journalDay && !block.marker && !block.scheduled && !block.deadline
                  }) || []
    console.log('[faiz:] === logs', _logs)
    calendarSchedules = calendarSchedules.concat(_logs?.map(block => {
      const date = block?.page?.journalDay
      const time = block.content?.substr(0, 5)
      const hasTime = time.split(':')?.filter(num => !Number.isNaN(Number(num)))?.length === 2
      return genSchedule({
        blockData: block,
        category: hasTime ? 'time' : 'allday',
        start: hasTime ? dayjs(date + ' ' + time, 'YYYYMMDD HH:mm').format() : genCalendarDate(date),
        // end: hasTime ? day(date + ' ' + time, 'YYYYMMDD HH:mm').add(1, 'hour').format() : day(date, 'YYYYMMDD').add(1, 'day').format(),
        calendarConfig: customCalendarConfigs[0],
      })
    }))
  }

  console.log('[faiz:] === final calendarSchedules', calendarSchedules)
  return calendarSchedules
}

type ICategory = 'time' | 'allday' | 'milestone' | 'task'
function genSchedule(params: {
  blockData: any
  category: ICategory
  start?: string
  end?:string
  calendarConfig: ISettingsForm['calendarList'][number]
  isAllDay?: boolean
}) {
  const { blockData, category = 'time', start, end, calendarConfig, isAllDay } = params
  // const calendarId = calendarConfigs.find(calendar => calendar.pageId === blockData?.page?.id)?.id || 'journal'

  // let calendarConfig = calendarConfigs.find(config => config.id === 'journal')
  // // if is custom calendar
  // if (!isJournal && calendarId !== 'journal') {
  //   calendarConfig = calendarConfigs.find(config => config.id === calendarId)
  // }

  const title = blockData.content
                  .split('\n')[0]
                  ?.replace(new RegExp(`^${blockData.marker}`), '')
                  ?.replace(/^\d{2}:\d{2}/, '')
                  ?.trim?.()

  return {
    id: blockData.id,
    calendarId: calendarConfig.id,
    title,
    body: blockData.content,
    category,
    dueDateClass: '',
    start,
    end,
    raw: blockData,
    color: calendarConfig?.textColor,
    bgColor: calendarConfig?.bgColor,
    borderColor: calendarConfig?.borderColor,
    isAllDay,
  }
}

/**
 * 获取周报
 */
export const getWeekly = async (startDate, endDate) => {
  const keyword = logseq.settings?.logKey || DEFAULT_LOG_KEY
  const journalFormat = logseq.settings?.journalFormat || DEFAULT_JOURNAL_FORMAT
  const _start = dayjs(startDate, SHOW_DATE_FORMAT).format(journalFormat)
  const _end = dayjs(endDate, SHOW_DATE_FORMAT).format(journalFormat)
  const logs = await logseq.DB.q(`(and [[${keyword}]] (between [[${_start}]] [[${_end}]]))`)
  const _logs = logs
                  ?.filter(block => block.content?.trim() === `[[${keyword}]]`)
                  ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                  ?.flat()
                  ?.filter(block => {
                    const _content = block.content?.trim()
                    return _content.length > 0
                  })
  console.log('[faiz:] === weekly logs', _logs)
  return _logs
}

/**
 * 判断是否过期
 */
export const isOverdue = (block: any, date: number | string) => {
  if (block.marker && block.marker !== 'DONE') {
    const now = dayjs()
    const _date = dayjs(String(date), DEFAULT_BLOCK_DEADLINE_DATE_FORMAT)
    return now.isAfter(_date, 'day')
  }
  // 非 todo 及 done 的 block 不过期
  return false
}

export const initializeSettings = () => {
  const settings = logseq.settings
  // settings未初始化时手动初始化
  if (!settings?.initialized) {
    const _settings = getInitalSettings()
    logseq.updateSettings({ ..._settings, initialized: true })
    console.log('[faiz:] === initialize settings success', logseq.settings)
  }
}