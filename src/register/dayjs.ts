import dayjs from 'dayjs'

const initializeDayjs = (weekStartDay: 0 | 1) => {
  dayjs.updateLocale('en', {
    weekStart: weekStartDay,
  })
}

export default initializeDayjs