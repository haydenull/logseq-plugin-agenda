import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import updateLocale from 'dayjs/plugin/updateLocale'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import localeData from 'dayjs/plugin/localeData'
import difference from 'lodash/difference'
import isBetween from 'dayjs/plugin/isBetween'
import utc from 'dayjs/plugin/utc'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

dayjs.extend(weekday)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(localeData)
dayjs.extend(difference)
dayjs.extend(isBetween)
dayjs.extend(updateLocale)
dayjs.extend(utc)
dayjs.extend(quarterOfYear)

const initializeDayjs = (weekStartDay: 0 | 1) => {
  dayjs.updateLocale('en', {
    weekStart: weekStartDay,
  })
}

export default initializeDayjs