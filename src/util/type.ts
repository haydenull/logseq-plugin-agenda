export type ICustomCalendar = {
  id: string
  bgColor: string
  textColor: string
  borderColor: string
  enabled: boolean
}
export type ISettingsFormQuery = Partial<{
  script: string
  scheduleStart: string
  scheduleEnd: string
  dateFormatter: string
  isMilestone: boolean
  queryType: 'simple' | 'advanced'
}>
export type ISettingsForm = {
  theme?: 'light' | 'dark' | 'auto'
  lightThemeType?: 'green' | 'purple'
  homePage?: string
  defaultView: string
  weekStartDay: 0 | 1
  weekHourStart?: number
  weekHourEnd?: number
  ignoreTag?: string
  // journalDateFormatter: string
  defaultDuration: {
    unit: string
    value: number
  },
  logKey?: ICustomCalendar
  journal: ICustomCalendar & { query: ISettingsFormQuery[] }
  projectList?: ICustomCalendar[]
  calendarList: Array<ICustomCalendar & { query: ISettingsFormQuery[] }>
  subscriptionList?: Array<ICustomCalendar & { url: string }>
  pomodoro: {
    pomodoro: number,
    shortBreak: number,
    longBreak: number,
    autoStartBreaks: boolean,
    autoStartPomodoros: boolean,
    longBreakInterval: number,
    commonPomodoros: number[],
  },
  todoist?: {
    token: string
    project: number
  },
}
export type IQueryWithCalendar = {
  calendarConfig: ISettingsForm['calendarList'][number]
  query: ISettingsFormQuery
}
export type ICategory = 'time' | 'allday' | 'milestone' | 'task'