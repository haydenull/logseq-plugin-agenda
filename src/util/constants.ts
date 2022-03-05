import { ISettingsForm } from './util'

export const SHOW_DATE_FORMAT = 'YYYY-MM-DD'

export const DEFAULT_JOURNAL_FORMAT = 'YYYY-MM-DD ddd'

export const DEFAULT_LOG_KEY = 'Daily Log'

export const CALENDAR_VIEWS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: '2week', label: '2 Weeks' },
  { value: 'month', label: 'Monthly' },
]

export const DEFAULT_SETTINGS: ISettingsForm = {
  defaultView: 'month',
  weekStartDay: 0,
  journalDateFormatter: 'YYYY-MM-DD ddd',
  logKey: 'Daily Log',
  calendarList: [
    {
      id: 'journal',
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
          dateFormatter: 'YYYYMMDD',
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
          dateFormatter: 'YYYYMMDD',
        },
        // tasks with no deadline or scheduled but in journal
        {
          script: `
[:find (pull
  ?block
  [:block/uuid
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
  [(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING"} ?marker)]
  [(missing? $ ?block :block/scheduled)]
  [(missing? $ ?block :block/deadline)]]
          `,
          scheduleStart: 'page.journal-day',
          dateFormatter: 'YYYYMMDD',
        },
        // milestone
        {
          script: `
[:find (pull ?block [*])
  :where
  [?page :block/name ?pname]
  [?block :block/page ?page]
  (not [(contains? #{"高中教务系统"} ?pname)])
  [?rp :block/name "milestone"]
  [?block :block/refs ?rp]]
          `,
          scheduleStart: 'scheduled',
          dateFormatter: 'YYYYMMDD',
          isMilestone: true,
        }
      ],
    },
  ],
}

export const CALENDAR_THEME = {
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
}

export const DEFAULT_BLOCK_DEADLINE_DATE_FORMAT = "YYYYMMDD"