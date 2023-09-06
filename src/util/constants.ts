/* eslint-disable no-useless-escape */

/* eslint-disable no-misleading-character-class */
import { type ThemeConfig, theme as antdTheme } from 'antd'

import { Language } from '@/constants/language'

import type { ISettingsForm } from './type'

export const SHOW_DATE_FORMAT = 'yyyy-MM-dd'

export const DEFAULT_JOURNAL_FORMAT = 'yyyy-MM-dd EEE'

export const DEFAULT_LOG_KEY = 'Daily Log'

// export const TIME_REG = /(?:[0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/
export const TIME_REG = /^((?:[0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9])(-(?:[0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9])*/
// export const MARKDOWN_PROJECT_TIME_REG = />\[.+\]\(#(agenda:\/\/[^\n\r ]+)\)/
export const MARKDOWN_PROJECT_TIME_REG = />\[[\d -:]+\]\(#(agenda:\/\/[^\n\r ]+)\)/
// export const ORG_PROJECT_TIME_REG = />\[\[#(agenda:\/\/[^\n\r ]+)\]\[.+\]\]/
export const ORG_PROJECT_TIME_REG = />\[\[#(agenda:\/\/[^\n\r ]+)\]\[[\d -:]+\]\]/
// export const MARKDOWN_POMODORO_REG = />\[.+\]\(#(agenda-pomo:\/\/[^\n\r ]+)\)/
export const MARKDOWN_POMODORO_REG = />\[[🍅 0-9min]+\]\(#(agenda-pomo:\/\/[^\n\r ]+)\)/
// export const ORG_POMODORO_REG = />\[\[#(agenda-pomo:\/\/[^\n\r ]+)\]\[.+\]\]/
export const ORG_POMODORO_REG = />\[\[#(agenda-pomo:\/\/[^\n\r ]+)\]\[[🍅 0-9min]+\]\]/
// >[🍅](#agenda-pomo://?t=p-20220614123213-10,h-2023829809-4)

// [6292169917](https://todoist.com/showTask?id=6292169917)
export const MARKDOWN_TODOISTLINK_REG = /\[\w+\]\(([\w:\/\.\?=]+)\)/
// [[https://todoist.com/showTask?id=6292169917][6292169917]]
export const ORG_TODOISTLINK_REG = /\[\[([\w:\/\.\?=]+)\]\[\w+\]\]/

export const CALENDAR_VIEWS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: '2week', label: '2 Weeks' },
  { value: 'month', label: 'Monthly' },
]

export const ANTD_THEME_CONFIG: Record<string, ThemeConfig> = {
  green: {
    token: {
      colorPrimary: '#047857',
    },
    components: {
      Select: {
        optionSelectedBg: '#e9f2f0',
      },
      DatePicker: {
        cellActiveWithRangeBg: '#e9f2f0',
        cellHoverWithRangeBg: '#c3e3db',
        cellRangeBorderColor: '#c3e3db',
      },
    },
  },
  purple: {
    token: {
      colorPrimary: '#5146a0',
    },
  },
  dark: {
    token: {
      colorPrimary: '#fcb714',
      colorBgBase: '#212528',
      colorBgContainer: '#282c31',
      colorBgElevated: '#282c31',
    },
    components: {
      Select: {
        optionSelectedBg: '#6b531a',
      },
      DatePicker: {
        cellActiveWithRangeBg: '#5e460c',
        cellHoverWithRangeBg: '#6b531a',
        cellRangeBorderColor: '#6b531a',
      },
    },
    algorithm: antdTheme.darkAlgorithm,
  },
}

export const THEME = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
]
export const LIGHT_THEME_TYPE = [
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
]

export const DEFAULT_SETTINGS: ISettingsForm = {
  theme: 'auto',
  lightThemeType: 'green',
  language: Language.English,
  homePage: 'dashboard',
  defaultView: 'month',
  weekStartDay: 0,
  weekHourStart: 0,
  weekHourEnd: 24,
  // journalDateFormatter: 'YYYY-MM-DD ddd',
  defaultDuration: {
    value: 0.5,
    unit: 'h',
  },
  logKey: {
    id: DEFAULT_LOG_KEY,
    bgColor: '#047857',
    textColor: '#fff',
    borderColor: '#047857',
    enabled: true,
  },
  journal: {
    id: 'Journal',
    bgColor: '#047857',
    textColor: '#fff',
    borderColor: '#047857',
    enabled: true,
    query: [
      // schedule tasks
      {
        script: `
[:find (pull ?block [*])
:where
[?block :block/marker ?marker]
[(missing? $ ?block :block/deadline)]
(not [(missing? $ ?block :block/scheduled)])
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'scheduled',
        dateFormatter: 'yyyyMMdd',
        queryType: 'advanced',
        isMilestone: false,
      },
      // deadline tasks
      {
        script: `
[:find (pull ?block [*])
:where
[?block :block/marker ?marker]
[(missing? $ ?block :block/scheduled)]
(not [(missing? $ ?block :block/deadline)])
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'deadline',
        dateFormatter: 'yyyyMMdd',
        queryType: 'advanced',
        isMilestone: false,
      },
      // tasks with no deadline or scheduled but in journal
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
  [:db/id :block/name :block/original-name :block/journal-day :block/journal?]}])
:where
[?block :block/page ?page]
[?page :block/journal? true]
[?block :block/marker ?marker]
[(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]
[(missing? $ ?block :block/scheduled)]
[(missing? $ ?block :block/deadline)]]
        `,
        scheduleStart: 'page.journal-day',
        dateFormatter: 'yyyyMMdd',
        isMilestone: false,
        queryType: 'advanced',
      },
      {
        script: `
[:find (pull
  ?block
  [:block/uuid
    :block/parent
    :db/id
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
      [:db/id :block/name :block/original-name :block/journal-day :block/journal?]}
    {:block/refs
      [:block/journal-day]}])
  :where
  [?block :block/marker ?marker]
  [?rp :block/journal? true]
  [?block :block/refs ?rp]
  [(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
        `,
        scheduleStart: 'refs[0].journal-day',
        dateFormatter: 'yyyyMMdd',
        isMilestone: false,
        queryType: 'advanced',
      },
      // milestone
      {
        script: `
[:find (pull ?block [*])
:where
[?rp :block/name "milestone"]
[?block :block/scheduled]
[?block :block/refs ?rp]]
        `,
        scheduleStart: 'scheduled',
        dateFormatter: 'yyyyMMdd',
        isMilestone: true,
        queryType: 'advanced',
      },
    ],
  },
  projectList: [],
  calendarList: [],
  subscriptionList: [],
  dailyLogTagList: [],
  pomodoro: {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4,
    commonPomodoros: [10, 15, 20, 25, 40],
  },
  openai: {
    apiBaseUrl: 'https://api.openai.com',
  },
}

export const DAILY_LOG_CONFIG = {
  id: 'log',
  bgColor: '#e5f5fd',
  textColor: '#111',
  borderColor: '#e5f5fd',
  enabled: true,
}

export const CALENDAR_THEME = {
  light: {
    // month day grid cell 'day'
    'month.holidayExceptThisMonth.color': '#f3acac',
    'month.dayExceptThisMonth.color': '#bbb',
    'month.weekend.backgroundColor': '#fafafa',
    'month.day.fontSize': '16px',

    // week daygrid 'daygrid'
    'week.daygrid.borderRight': '1px solid #ddd',
    'week.daygrid.backgroundColor': 'inherit',

    'week.daygridLeft.width': '77px',
    'week.daygridLeft.backgroundColor': '#a8def74d',
    'week.daygridLeft.paddingRight': '5px',
    'week.daygridLeft.borderRight': '1px solid #ddd',

    'week.today.backgroundColor': '#b857d81f',
    'week.weekend.backgroundColor': '#fafafa',

    // week timegrid 'timegrid'
    'week.timegridLeft.width': '77px',
    'week.timegridLeft.backgroundColor': '#03a9f44d',
    'week.timegridLeft.borderRight': '1px solid #ddd',
    'week.timegridLeft.fontSize': '12px',
    'week.timegridLeftTimezoneLabel.height': '51px',
    'week.timegridLeftAdditionalTimezone.backgroundColor': '#fdfdfd',

    'week.timegridOneHour.height': '48px',
    'week.timegridHalfHour.height': '24px',
    'week.timegridHalfHour.borderBottom': '1px dotted #f9f9f9',
    'week.timegridHorizontalLine.borderBottom': '1px solid #eee',

    'week.timegrid.paddingRight': '10px',
    'week.timegrid.borderRight': '1px solid #ddd',
    'week.timegridSchedule.borderRadius': '0',
    'week.timegridSchedule.paddingLeft': '0',

    'week.currentTime.color': '#135de6',
    'week.currentTime.fontSize': '12px',
    'week.currentTime.fontWeight': 'bold',

    'week.pastTime.color': '#808080',
    'week.pastTime.fontWeight': 'normal',

    'week.futureTime.color': '#333',
    'week.futureTime.fontWeight': 'normal',

    'week.currentTimeLinePast.border': '1px solid rgba(19, 93, 230, 0.3)',
    'week.currentTimeLineBullet.backgroundColor': '#135de6',
    'week.currentTimeLineToday.border': '1px solid #135de6',
    'week.currentTimeLineFuture.border': '1px solid #135de6',
  },
  dark: {
    'common.backgroundColor': '#32373d',
    'common.saturday.color': '#babec4',
    'common.dayname.color': '#babec4',
    'common.border': '1px solid #58595c',
    'common.creationGuide.backgroundColor': '#32373d',

    // month header 'dayname'
    'month.dayname.borderLeft': '1px solid #58595c',
    // month day grid cell 'day'
    'month.holidayExceptThisMonth.color': '#f3acac',
    'month.dayExceptThisMonth.color': '#bbb',
    'month.weekend.backgroundColor': '#282c31',
    'month.day.fontSize': '16px',

    // week vertical panel 'vpanel'
    'week.vpanelSplitter.border': '1px solid #58595c',

    // week header 'dayname'
    'week.today.color': '#fff',
    'week.pastDay.color': '#8f9296',
    'week.dayname.borderTop': '1px solid #58595c',
    'week.dayname.borderBottom': '1px solid #58595c',

    // week daygrid 'daygrid'
    'week.daygrid.borderRight': '1px solid #58595c',
    'week.daygrid.backgroundColor': 'inherit',

    'week.daygridLeft.width': '77px',
    'week.daygridLeft.backgroundColor': 'rgba(252, 183, 20, 0.3)',
    'week.daygridLeft.paddingRight': '5px',
    'week.daygridLeft.borderRight': '1px solid #58595c',

    'week.today.backgroundColor': '#b857d81f',
    'week.weekend.backgroundColor': '#282c31',

    // week timegrid 'timegrid'
    'week.timegridLeft.width': '77px',
    'week.timegridLeft.backgroundColor': 'rgba(252, 183, 20, 0.4)',
    'week.timegridLeft.borderRight': '1px solid #58595c',
    'week.timegridLeft.fontSize': '12px',
    'week.timegridLeftTimezoneLabel.height': '51px',
    'week.timegridLeftAdditionalTimezone.backgroundColor': '#fdfdfd',

    'week.timegridOneHour.height': '48px',
    'week.timegridHalfHour.height': '24px',
    'week.timegridHalfHour.borderBottom': '1px dotted #3d3e40',
    'week.timegridHorizontalLine.borderBottom': '1px solid #58595c',

    'week.timegrid.paddingRight': '10px',
    'week.timegrid.borderRight': '1px solid #58595c',
    'week.timegridSchedule.borderRadius': '0',
    'week.timegridSchedule.paddingLeft': '0',

    'week.currentTime.color': '#fcb714',
    'week.currentTime.fontSize': '12px',
    'week.currentTime.fontWeight': 'bold',

    'week.pastTime.color': '#bababd',
    'week.pastTime.fontWeight': 'normal',

    'week.futureTime.color': '#dadade',
    'week.futureTime.fontWeight': 'normal',

    'week.currentTimeLinePast.border': '1px solid rgba(252, 183, 20, 0.4)',
    'week.currentTimeLineBullet.backgroundColor': '#fcb714',
    'week.currentTimeLineToday.border': '1px solid #fcb714',
    'week.currentTimeLineFuture.border': '1px solid #fcb714',
  },
}

export const DEFAULT_BLOCK_DEADLINE_DATE_FORMAT = 'yyyyMMdd'

export const DURATION_UNITS = [
  // { value: 'w', label: 'week' },
  // { value: 'M', label: 'month' },
  // { value: 'y', label: 'year' },
  { value: 'm', label: 'minute' },
  { value: 'h', label: 'hour' },
  // { value: 'd', label: 'day' },
]

export const SCHEDULE_PARENT_BLOCK = 'Agenda'

export const YES_NO_SELECTION = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
]

export const POMODORO_INTERRUPTION_SEPARATOR = '|`~|'

export const DEFAULT_PROJECT = {
  id: undefined,
  bgColor: '#b8e986',
  textColor: '#4a4a4a',
  borderColor: '#047857',
  enabled: true,
}

// const CALENDAR_DONN_TASK_BASE_STYLE = 'opacity: 0.6; background-image: var(--ls-checked-img); background-size: 18px; background-repeat: no-repeat; padding-left: 20px;'
// export const CALENDAR_DONN_TASK_ALLDAY_STYLE = CALENDAR_DONN_TASK_BASE_STYLE + 'background-position: 2px center;'
// export const CALENDAR_DONN_TASK_TIME_STYLE = CALENDAR_DONN_TASK_BASE_STYLE + 'background-position: 8px center;'
const CALENDAR_DONN_TASK_BASE_STYLE = 'opacity: 0.6; text-decoration: line-through;'
export const CALENDAR_DONN_TASK_ALLDAY_STYLE = CALENDAR_DONN_TASK_BASE_STYLE
export const CALENDAR_DONN_TASK_TIME_STYLE = CALENDAR_DONN_TASK_BASE_STYLE
