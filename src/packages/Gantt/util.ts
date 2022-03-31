import dayjs, { Dayjs } from 'dayjs'
import { clone } from 'lodash'
import { ICooradinate, IEvent, IGroup, IMode } from './type'
import { CALENDAR_EVENT_HEIGHT, CALENDAR_GROUP_GAP, SIDEBAR_GROUP_TITLE_HEIGHT } from './constants'

export const extractDays = (startDate: Dayjs, endDate: Dayjs): Dayjs[] => {
  const days: Dayjs[] = []
  let day = startDate
  while (day.isSameOrBefore(endDate)) {
    days.push(day.clone())
    day = day.add(1, 'day')
  }
  return days
}

export const extractWeeks = (startDate: Dayjs, endDate: Dayjs): Dayjs[] => {
  const weeks: Dayjs[] = []
  let day = startDate
  while (day.isSameOrBefore(endDate)) {
    weeks.push(day.clone())
    day = day.add(1, 'week')
  }
  return weeks
}

export const extractMonths = (startDate: Dayjs, endDate: Dayjs): Dayjs[] => {
  const months: Dayjs[] = []
  let month = startDate
  while (month.isSameOrBefore(endDate)) {
    months.push(month.clone())
    month = month.add(1, 'month')
  }
  return months
}

export const isWeekend = (day: Dayjs): boolean => {
  return day.day() === 0 || day.day() === 6
}

export const getDataWithGroupCoordinates = (data: IGroup[], mode: IMode = 'simple') => {
  let dataWithCoordinates: (IGroup & {coordinate: ICooradinate})[] = []
  data.forEach((group, index) => {
    const preGroup = dataWithCoordinates[index - 1]
    const { levelCount = 0, events = [], milestones = [] } = preGroup || {}
    const eventsCount = mode === 'simple' ? levelCount : events.length
    const milestoneCount = mode === 'simple' ? (milestones.length > 0 ? 1 : 0) : milestones.length
    const y = index === 0 ? 0 : preGroup.coordinate.y + (eventsCount + milestoneCount) * CALENDAR_EVENT_HEIGHT + CALENDAR_GROUP_GAP + SIDEBAR_GROUP_TITLE_HEIGHT

    dataWithCoordinates.push({
      ...group,
      coordinate: {
        x: 0,
        y: y,
      },
    })
  })
  return dataWithCoordinates
}
export const getXCoordinate = (start: Dayjs, day: Dayjs): number => {
  return day.diff(start, 'day') * 108
}

export const scrollToDate = (date: Dayjs) => {
  document.querySelector(`#date${date.format('YYYYMMDD')}`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
}

export const transformDataToSimpleMode = (data: IGroup[]) => {
  return data.map(group => transformGroupToSimpleMode(group))
}
export const transformGroupToSimpleMode = (group: IGroup) => {
  const { events } = group
  // events 按开始时间排序
  events.sort((a, b) => dayjs(a.start).diff(dayjs(b.start)))

  // 按开始时间分组
  let classByStart = new Map<string, IEvent[]>()
  events.forEach((event) => {
    const { start } = event
    if (classByStart.has(start)) {
      classByStart.get(start)?.push(event)
    } else {
      classByStart.set(start, [event])
    }
  })
  // 组内按持续时间降序
  classByStart.forEach((events) => {
    events.sort((a, b) => {
      const aDuration = dayjs(a.end).diff(dayjs(a.start), 'day')
      const bDuration = dayjs(b.end).diff(dayjs(b.start), 'day')
      return bDuration - aDuration
    })
  })

  const mapValues = Array.from(classByStart.values())
  const rangeStart = mapValues[0]?.[0]?.start
  const rangeEnd = mapValues[mapValues.length - 1]?.[0]?.end
  // map 转为 array
  const classByStartArray = mapValues.flat()

  let levelEvents: IEvent[][] = addEventsToLevel(classByStartArray, [], dayjs(rangeStart), dayjs(rangeEnd))

  return {
    ...group,
    levelCount: levelEvents.length,
    events: levelEvents.map((level, index) => {
      return level.map(event => {
        return {
          ...event,
          level: index,
        }
      })
    }).flat(),
  }
}

function genRangeMap(start: Dayjs, end: Dayjs) {
  const rangeMap = new Map<string, boolean>()
  extractDays(start, end).forEach((day) => {
    rangeMap.set(day.format('YYYY-MM-DD'), false)
  })
  return rangeMap
}
function addEventsToLevel(events: IEvent[] = [], levelArr: IEvent[][] = [], rangeStart: Dayjs, rangeEnd: Dayjs) {
  const rangeDaysMap = genRangeMap(dayjs(rangeStart), dayjs(rangeEnd))
  const levelItem: IEvent[] = []
  const notCurrentLevelEvents: IEvent[] = []
  events.forEach(event => {
    const { start, end } = event
    const startDay = dayjs(start)
    const endDay = dayjs(end)
    const rangeDays = extractDays(startDay, endDay).map(day => day.format('YYYY-MM-DD'))
    if (rangeDaysMap.get(startDay.format('YYYY-MM-DD')) === false) {
      rangeDays.forEach((day) => {
        rangeDaysMap.set(day, true)
      })
      levelItem.push(event)
    } else {
      notCurrentLevelEvents.push(event)
    }
  })
  levelArr.push(levelItem)
  if (notCurrentLevelEvents?.length === 0) return levelArr
  return addEventsToLevel(notCurrentLevelEvents, levelArr, rangeStart, rangeEnd)
}