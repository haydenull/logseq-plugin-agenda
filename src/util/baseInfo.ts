import { ISchedule } from 'tui-calendar'
import { CALENDAR_THEME, DEFAULT_SETTINGS } from './constants'
import { ISettingsForm } from './type'

export const getInitalSettings = (): ISettingsForm => {
  let logKey = logseq.settings?.logKey
  // 适配 logKey 参数变化
  if (typeof logKey === 'string') {
    logKey = {
      ...DEFAULT_SETTINGS.logKey,
      id: logKey,
    }
  }
  return {
    ...DEFAULT_SETTINGS,
    ...logseq.settings,
    logKey,
  }
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

export const getDefaultCalendarOptions = () => {
  let defaultView = logseq.settings?.defaultView || 'month'
  if (logseq.settings?.defaultView === '2week') defaultView = 'month'
  return {
    defaultView,
    taskView: true,
    scheduleView: true,
    useDetailPopup: true,
    isReadOnly: false,
    disableClick: true,
    theme: CALENDAR_THEME,
    usageStatistics: false,
    week: {
      startDayOfWeek: logseq.settings?.weekStartDay || 0,
      // narrowWeekend: true,
    },
    month: {
      startDayOfWeek: logseq.settings?.weekStartDay || 0,
      scheduleFilter: (schedule: ISchedule) => {
        return Boolean(schedule.isVisible)
      },
      visibleWeeksCount: logseq.settings?.defaultView === '2week' ? 2 : undefined,
    },
    template: {
      taskTitle: () => '<span class="tui-full-calendar-left-content">Overdue</span>',
      task: (schedule: ISchedule) => '🔥' + schedule.title,
      timegridDisplayPrimayTime: function(time) {
        if (time.hour < 10) return '0' + time.hour + ':00'
        return time.hour + ':00'
      },
      popupDetailBody: (schedule: ISchedule) => {
        const calendar = `<br/><b>Calendar: ${schedule.calendarId}</b>`
        const navBtn = schedule.raw?.subscription ? '' : '<br/><a id="faiz-nav-detail" href="javascript:void(0);">Navigate To Block</a>'
        return `
          <div class="calendar-popup-detail-content">
            ${schedule.body?.split('\n').join('<br/>')}
          </div>
          ${calendar}
          ${navBtn}
        `
      },
    },
  }
}

export const genDefaultQuery = (pageName: string) => {
  return {
    id: pageName,
    bgColor: '#b8e986',
    textColor: '#4a4a4a',
    borderColor: '#047857',
    enabled: true,
    query: [
      // scheduled tasks
      {
        script: `
[:find (pull ?block [*])
:where
[?block :block/marker ?marker]
[(missing? $ ?block :block/deadline)]
(not [(missing? $ ?block :block/scheduled)])
[?page :block/name ?pname]
[?block :block/page ?page]
[(contains? #{"${pageName}"} ?pname)]
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'scheduled',
        dateFormatter: 'yyyyMMdd',
      },
      // deadline tasks
      {
        script: `
[:find (pull ?block [*])
:where
[?block :block/marker ?marker]
[(missing? $ ?block :block/scheduled)]
[(get-else $ ?block :block/deadline "nil") ?d]
[(not= ?d "nil")]
[?page :block/name ?pname]
[?block :block/page ?page]
[(contains? #{"${pageName}"} ?pname)]
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'deadline',
        dateFormatter: 'yyyyMMdd',
      },
      // milestone
      {
        script: `
[:find (pull ?block [*])
:where
[?page :block/name ?pname]
[?block :block/page ?page]
[(contains? #{"${pageName}"} ?pname)]
[?rp :block/name "milestone"]
[?block :block/refs ?rp]]
        `,
        scheduleStart: 'scheduled',
        dateFormatter: 'yyyyMMdd',
        isMilestone: true,
      }
    ],
  }
}

export const genAgendaQuery = (pageName: string) => {
  return {
    id: pageName,
    bgColor: '#b8e986',
    textColor: '#4a4a4a',
    borderColor: '#047857',
    enabled: true,
    query: [
      {
        script: `
[:find (pull
  ?block
  [:block/uuid
    :db/id
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
    {:block/page
    [:db/id :block/name :block/original-name :block/journal-day :block/journal? :block/properties]}])
:where
[?block :block/marker ?marker]
[?page :block/name ?pname]
[?block :block/page ?page]
[(contains? #{"${pageName}"} ?pname)]
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'properties.start',
        scheduleEnd: 'properties.end',
        dateFormatter: 'yyyy-MM-dd',
      },
      {
        script: `
[:find (pull
  ?block
  [:block/uuid
    :db/id
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
    {:block/page
    [:db/id :block/name :block/original-name :block/journal-day :block/journal? :block/properties]}])
:where
[?block :block/marker ?marker]
[?page :block/name ?pname]
[?block :block/page ?page]
[(contains? #{"${pageName}"} ?pname)]
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'properties.start',
        scheduleEnd: 'properties.end',
        dateFormatter: 'yyyy-MM-dd HH:mm',
      },
    ]
  }
}