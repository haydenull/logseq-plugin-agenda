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
  // journalDateFormatter: string
  defaultDuration: {
    unit: string
    value: number
  },
  logKey?: ICustomCalendar
  calendarList: Array<ICustomCalendar & { query: ISettingsFormQuery[] }>
  subscriptionList?: Array<ICustomCalendar & { url: string }>
}
export type IQueryWithCalendar = {
  calendarConfig: ISettingsForm['calendarList'][number]
  query: ISettingsFormQuery
}
export type ICategory = 'time' | 'allday' | 'milestone' | 'task'