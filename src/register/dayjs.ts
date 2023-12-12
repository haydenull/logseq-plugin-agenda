import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isoWeek from 'dayjs/plugin/isoWeek'
import localeData from 'dayjs/plugin/localeData'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import updateLocale from 'dayjs/plugin/updateLocale'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'

dayjs.extend(weekday)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(localeData)
dayjs.extend(isBetween)
dayjs.extend(updateLocale)
dayjs.extend(utc)
dayjs.extend(quarterOfYear)
dayjs.extend(isoWeek)
dayjs.extend(weekOfYear) // Use plugin

const initializeDayjs = (weekStartDay: 0 | 1) => {
  dayjs.locale('zh-cn')
  // dayjs.updateLocale('en', {
  //   weekStart: weekStartDay,
  // })
  dayjs.updateLocale('zh-cn', {
    weekStart: weekStartDay,
  })
}

export default initializeDayjs
