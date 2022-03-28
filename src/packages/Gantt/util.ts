import dayjs, { Dayjs } from 'dayjs'

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