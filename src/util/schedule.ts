import { ISchedule } from 'tui-calendar'
import { flattenDeep, get } from 'lodash'
import { addHours, addMinutes, endOfDay, format, formatISO, isAfter, parse, parseISO, startOfDay } from 'date-fns'
import { getInitalSettings } from './baseInfo'
import { ICategory, IQueryWithCalendar, ISettingsForm } from './type'
import { DEFAULT_BLOCK_DEADLINE_DATE_FORMAT, DEFAULT_JOURNAL_FORMAT, DEFAULT_SETTINGS } from './constants'

export const getSchedules = async () => {
  // console.log('[faiz:] === getSchedules start ===', logseq.settings, getInitalSettings())
  let calendarSchedules:ISchedule[] = []

  // get calendar configs
  const { calendarList: calendarConfigs = [], logKey, defaultDuration, subscriptionList } = getInitalSettings()
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
    const { script = '', scheduleStart = '', scheduleEnd = '', dateFormatter, isMilestone, queryType } = query
    let blocks: any[] = []
    if (queryType === 'simple') {
      blocks = await logseq.DB.q(script) || []
    } else {
      blocks = await logseq.DB.datascriptQuery(script)
    }
    console.log('[faiz:] === search blocks by query: ', script, blocks)

    const buildSchedulePromiseList = flattenDeep(blocks).map(async block => {
      const _dateFormatter = ['scheduled', 'deadline'].includes(scheduleStart || scheduleEnd) ? DEFAULT_BLOCK_DEADLINE_DATE_FORMAT : dateFormatter || DEFAULT_JOURNAL_FORMAT
      const start = get(block, scheduleStart, undefined)
      const end = get(block, scheduleEnd, undefined)
      let hasTime = /[Hhm]+/.test(_dateFormatter || '')

      let _start
      let _end
      try {
        _start = start && genCalendarDate(start, _dateFormatter)
        _end = end && (hasTime ? genCalendarDate(end, _dateFormatter) : formatISO(endOfDay(parse(end, _dateFormatter, new Date()))))
      } catch (err) {
        console.warn('[faiz:] === parse calendar date error: ', err, block, query)
        return []
      }
      if (start && ['scheduled', 'deadline'].includes(scheduleStart)) {
        const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleStart.toUpperCase()}:`))?.trim()
        const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
        if (time) {
          _start = formatISO(parse(`${start} ${time}`, 'yyyyMMdd HH:mm', new Date()))
          hasTime = true
        }
      }
      if (end && ['scheduled', 'deadline'].includes(scheduleEnd)) {
        const dateString = block.content?.split('\n')?.find(l => l.startsWith(`${scheduleEnd.toUpperCase()}:`))?.trim()
        const time = / (\d{2}:\d{2})[ >]/.exec(dateString)?.[1] || ''
        if (time) {
          _end = formatISO(parse(_end, 'yyyyMMdd HH:mm', new Date()))
          hasTime = true
        }
      }

      let _category: ICategory = hasTime ? 'time' : 'allday'
      if (isMilestone) _category = 'milestone'
      const _isOverdue = isOverdue(block, _end || _start)
      if (!isMilestone && _isOverdue) _category = 'task'

      const schedule = await genSchedule({
        blockData: block,
        category: _category,
        start: _start,
        end: _end,
        calendarConfig,
        defaultDuration,
        isAllDay: !isMilestone && !hasTime && !_isOverdue,
      })
      // show overdue tasks in today
      return _isOverdue
        ? [
          schedule,
          await genSchedule({
            blockData: block,
            category: _category,
            calendarConfig,
            defaultDuration,
            isAllDay: !isMilestone && !hasTime && !_isOverdue,
          }),
        ]
        : schedule
    })
    return Promise.all(buildSchedulePromiseList)
  })

  const scheduleRes = await Promise.allSettled(queryPromiseList)
  const scheduleResFulfilled:ISchedule[] = []
  scheduleRes.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      scheduleResFulfilled.push(res.value)
    } else {
      console.error('[faiz:] === scheduleRes error: ', scheduleQueryList[index], res)
      const { calendarConfig, query } = scheduleQueryList[index]
      const msg = `Query Exec Error:
calendar: ${calendarConfig.id}
query: ${query.script}
message: ${res.reason.message}`
      logseq.App.showMsg(msg, 'error')
    }
  })
  calendarSchedules = flattenDeep(calendarSchedules.concat(scheduleResFulfilled))

  // Daily Logs
  if (logKey?.enabled) {
    const logs = await logseq.DB.q(`[[${logKey.id}]]`)
    const _logs = logs
                  ?.filter(block => {
                    if (block.headingLevel && block.format === 'markdown') {
                      block.content = block.content.replace(new RegExp(`^#{${block.headingLevel}} `), '')
                    }
                    return block.content?.trim() === `[[${logKey.id}]]`
                  })
                  ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                  ?.flat()
                  ?.filter(block => {
                    const _content = block.content?.trim()
                    return _content.length > 0 && block?.page?.journalDay && !block.marker && !block.scheduled && !block.deadline
                  }) || []
    const _logSchedulePromises = _logs?.map(async block => {
      const date = block?.page?.journalDay
      const { start: _startTime, end: _endTime } = getTimeInfo(block?.content.replace(new RegExp(`^${block.marker} `), ''))
      const hasTime = _startTime || _endTime
      return await genSchedule({
        blockData: block,
        category: hasTime ? 'time' : 'allday',
        start: _startTime ? formatISO(parse(date + ' ' + _startTime, 'yyyyMMdd HH:mm', new Date())) : genCalendarDate(date),
        end: _endTime ? formatISO(parse(date + ' ' + _endTime, 'yyyyMMdd HH:mm', new Date())) : undefined,
        calendarConfig: logKey,
        defaultDuration,
        isAllDay: !hasTime,
      })
    })
    const _logSchedules = await Promise.all(_logSchedulePromises)
    calendarSchedules = calendarSchedules.concat(_logSchedules)
  }

  return calendarSchedules
}


/**
 * 判断是否过期
 */
export const isOverdue = (block: any, date: string) => {
  if (block.marker && block.marker !== 'DONE') {
    return isAfter(startOfDay(new Date()), parseISO(date))
  }
  // 非 todo 及 done 的 block 不过期
  return false
}

/**
 * 提取时间信息
 * eg: '12:00 foo' => { start: '12:00', end: undefined }
 * eg: '12:00-13:00 foo' => { start: '12:00', end: '13:00' }
 * eg: 'foo' => { start: undefined, end: undefined }
 */
 export const getTimeInfo = (content: string) => {
  const reg = /^(\d{2}:\d{2})(-\d{2}:\d{2})*/
  const res = content.match(reg)
  if (res) return { start: res[1], end: res[2]?.slice(1) }
  return { start: undefined, end: undefined }
}

/**
 * 填充 block reference 内容
 */
export const fillBlockReference = async (blockContent: string) => {
  const BLOCK_REFERENCE_REG = /\(\([0-9a-z\-]{30,}\)\)/

  if (BLOCK_REFERENCE_REG.test(blockContent)) {
    const uuid = BLOCK_REFERENCE_REG.exec(blockContent)?.[0]?.replace('((', '')?.replace('))', '')
    if (uuid) {
      const referenceData = await logseq.Editor.getBlock(uuid)
      return blockContent.replace(BLOCK_REFERENCE_REG, referenceData?.content || '')
    }
  }

  return blockContent
}

export async function genSchedule(params: {
  blockData: any
  category: ICategory
  start?: string
  end?:string
  calendarConfig: Omit<ISettingsForm['calendarList'][number], 'query'>
  isAllDay?: boolean
  isReadOnly?: boolean
  defaultDuration?: ISettingsForm['defaultDuration']
}) {
  const { blockData, category = 'time', start, end, calendarConfig, isAllDay, defaultDuration, isReadOnly } = params

  let title = blockData.content
                  .split('\n')[0]
                  ?.replace(new RegExp(`^${blockData.marker} `), '')
                  ?.replace(/^(\d{2}:\d{2})(-\d{2}:\d{2})*/, '')
                  ?.trim?.()
  title = await fillBlockReference(title)
  title = title?.split('\n')[0]
  const isDone = blockData.marker === 'DONE'
  const isSupportEdit = isReadOnly === undefined ? blockData.page?.properties?.agenda === true : !isReadOnly

  const { defaultDuration: _defaultDuration } = DEFAULT_SETTINGS
  let _end = end
  if (category === 'time' && !end && start && defaultDuration) {
    const value = defaultDuration.value || _defaultDuration.value
    const unit = defaultDuration.unit || _defaultDuration.unit
    const addDuration = unit === 'm' ? addMinutes : addHours
    _end = formatISO(addDuration(parseISO(start), value))
  }

  return {
    id: blockData.id,
    calendarId: calendarConfig.id,
    title: isDone ? `✅${title}` : title,
    body: await fillBlockReference(blockData.content),
    category,
    dueDateClass: '',
    start,
    end: _end,
    raw: blockData,
    color: calendarConfig?.textColor,
    bgColor: calendarConfig?.bgColor,
    borderColor: calendarConfig?.borderColor,
    isAllDay,
    customStyle: isDone ? 'opacity: 0.6;' : '',
    isReadOnly: !isSupportEdit,
  }
}

export const genCalendarDate = (date: number | string, format = DEFAULT_BLOCK_DEADLINE_DATE_FORMAT) => {
  return formatISO(parse('' + date, format, new Date()))
}