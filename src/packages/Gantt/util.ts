import dayjs, { Dayjs } from 'dayjs'
import { ICooradinate, IGroup } from './type'

export const extractDays = (startDate: Dayjs, endDate: Dayjs): Dayjs[] => {
  const days: Dayjs[] = []
  let day = startDate
  console.log('[faiz:] === day.isSameOrBefore(endDate)', day.isSameOrBefore(endDate))
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

export const getDataWithGroupCoordinates = (data: IGroup[]) => {
  let dataWithCoordinates: (IGroup & {coordinate: ICooradinate})[] = []
  data.forEach((group, index) => {
    const preGroup = dataWithCoordinates[index - 1]
    const y = index === 0 ? 0 : preGroup.coordinate?.y + preGroup.events?.concat(preGroup.milestones || []).length * 40
    dataWithCoordinates.push({
      ...group,
      coordinate: {
        x: 0,
        y: y + 22,
      },
    })
  })
  return dataWithCoordinates
}
export const getXCoordinate = (start: Dayjs, day: Dayjs): number => {
  return day.diff(start, 'day') * 108
}
// export const getYCooordinate = (data: IGroup[], groupIndex, eventIndex): number => {
//   const dataWithHeight = data.map(group => {
//     return {
//       ...group,
//       height: group.events.concat(group.milestones || []).length * 40,
//     }
//   })
//   let dataWithY: (IGroup & {coordinate: {x: number, y: number}})[] = []
//   data.forEach((group, index) => {
//     const preGroup = dataWithY[index - 1]
//     const y = index === 0 ? 0 : dataWithY[index - 1].coordinate?.y + preGroup.events?.concat(preGroup.milestones || []).length * 40
//     dataWithY.push({
//       ...group,
//       coordinate: {
//         x: 0,
//         y: index * 40,
//       },
//     })
//   })

//   let y = 0
//   let group = groupIndex
//   while (group > 0) {
    
//   }
// }