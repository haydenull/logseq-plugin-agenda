import axios from 'axios'
import { formatISO, parseISO } from 'date-fns'
import ical from 'ical.js'
import { genSchedule } from './schedule'
import { ISettingsForm } from './type'

/**
 * get ical data
 */
 export const getSubCalendarSchedules = async (subscriptionCalendarList: ISettingsForm['subscriptionList'], defaultDuration?: ISettingsForm['defaultDuration']) => {
  if (!Array.isArray(subscriptionCalendarList)) return []
  const enabledCalendarList = subscriptionCalendarList?.filter(calendar => calendar.enabled)
  if (!enabledCalendarList?.length) return []

  const resList = await Promise.allSettled(enabledCalendarList.map(calendar => axios(calendar.url)))

  let schedules = []
  resList.forEach((res, index) => {
    if (res.status === 'rejected') return logseq.App.showMsg(`Get Calendar ${enabledCalendarList[index].id} data error\n${res.reason}`, 'error')
    try {
      const data = ical.parse(res.value.data)
      const { events } = parseVCalendar(data)
      schedules = schedules.concat(events.map(event => {
        const { dtstart, dtend, summary, description } = event
        const hasTime = dtstart.type === 'date-time'
        return genSchedule({
          blockData: { id: new Date().valueOf(), content: `${summary?.value || 'no summary'}\n${description?.value || ''}`, subscription: true },
          category: hasTime ? 'time' : 'allday',
          start: dtstart.value,
          end: dtend ? (hasTime ? dtend?.value : formatISO(parseISO(dtend?.value))) : undefined,
          calendarConfig: enabledCalendarList[index],
          defaultDuration,
          isAllDay: !hasTime,
        })
      }))
    } catch (error) {
      logseq.App.showMsg(`Parse Calendar ${enabledCalendarList[index].id} data error\n${error}`, 'error')
      console.log('[faiz:] === Parse Calendar error', error)
    }
  })

  return schedules
}

export const parseVCalendar = (data: any) => {
  function arrDataToObj(arr: any[]) {
    return arr.reduce((res, cur) => {
      return {
        ...res,
        [cur[0]]: {
          type: cur[2],
          value: cur[3],
        }
      }
    }, {})
  }
  const [calendarType, info, components] = data

  const events = components
                  .filter(component => component[0] === 'vevent')
                  .map(component => {
                    const [type, info, /*properties*/] = component
                    return arrDataToObj(info)
                  })

  return {
    type: calendarType,
    info: arrDataToObj(info),
    events,
  }

}