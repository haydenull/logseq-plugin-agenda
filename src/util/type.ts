import type { ValuesType } from 'utility-types'

import type { Language } from '@/constants/language'

export type ICustomCalendar = {
  id: string
  bgColor: string
  textColor: string
  borderColor: string
  enabled: boolean
}
export type ILogTag = Omit<ICustomCalendar, 'enabled'>
export type ISettingsFormQuery = Partial<{
  script: string
  scheduleStart: string
  scheduleEnd: string
  dateFormatter: string
  isMilestone: boolean
  queryType: 'simple' | 'advanced'
}>
export type CalendarConfig = ICustomCalendar & { query: ISettingsFormQuery[] }
export type ISettingsForm = {
  theme?: 'light' | 'dark' | 'auto'
  lightThemeType?: 'green' | 'purple'
  language: ValuesType<typeof Language>
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
  }
  logKey?: ICustomCalendar
  dailyLogTagList?: ILogTag[]
  journal: CalendarConfig
  projectList?: ICustomCalendar[]
  calendarList?: Array<CalendarConfig>
  subscriptionList?: Array<ICustomCalendar & { url: string }>
  pomodoro: {
    pomodoro: number
    shortBreak: number
    longBreak: number
    autoStartBreaks: boolean
    autoStartPomodoros: boolean
    longBreakInterval: number
    commonPomodoros: number[]
  }
  todoist?: {
    token?: string
    sync?: number
    project?: string
    filter?: string
    label?: string
    position?: string
  }
  openai?: {
    apiKey?: string
    apiBaseUrl?: string
  }
}
export type IQueryWithCalendar = {
  calendarConfig: CalendarConfig
  query: ISettingsFormQuery
}
export type ICategory = 'time' | 'allday' | 'milestone' | 'task'
