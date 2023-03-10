import { md } from '@/helper/md'
import { getCurrentTheme } from '@/util/logseq'
import { ISchedule } from 'tui-calendar'
import { CALENDAR_THEME, DEFAULT_SETTINGS } from './constants'
import { ISettingsForm } from './type'

export const getInitialSettings = (params = { filterInvalidedProject: true }): ISettingsForm => {
  const { filterInvalidedProject } = params
  let logKey = DEFAULT_SETTINGS.logKey
  const settingLogKey = logseq.settings?.logKey
  if (settingLogKey) {
    logKey = settingLogKey
    // 适配 logKey 参数变化
    if (typeof settingLogKey === 'string' && DEFAULT_SETTINGS.logKey) {
      logKey = {
        ...DEFAULT_SETTINGS.logKey,
        id: settingLogKey,
      }
    }
  }
  // let calendarList = logseq.settings?.calendarList || DEFAULT_SETTINGS.calendarList
  // const journalCalendar = calendarList.find(calendar => calendar.id.toLowerCase() === 'journal')
  // const excludeCalendar = `[?page :block/name ?pname]
  // [?block :block/page ?page]
  // (not [(contains? #{${calendarList.slice(1)?.map(calendar => `"${calendar.id}"`).join(' ')}} ?pname)])`
  // calendarList = [
  //   {
  //     ...journalCalendar,
  //     query: journalCalendar.query.map(query => {
  //       const scriptArr = query.script.split('\n')
  //       console.log('[faiz:] === scriptArr', scriptArr, scriptArr.slice(-1))
  //       return {
  //         ...query,
  //         script: scriptArr.slice(0, -1).concat(excludeCalendar).concat(scriptArr.slice(-1)).join('\n'),
  //       }
  //     })
  //   },
  //   ...calendarList.slice(1),
  // ]
  const projectList = logseq.settings?.projectList || DEFAULT_SETTINGS.projectList
  return {
    ...DEFAULT_SETTINGS,
    ...logseq.settings,
    // calendarList,
    logKey,
    projectList: filterInvalidedProject ? projectList?.filter(project => Boolean(project.id)) : projectList,
  }
}

export const initializeSettings = () => {
  const settings = logseq.settings
  // settings未初始化时手动初始化
  if (!settings?.initialized) {
    const _settings = getInitialSettings()
    logseq.updateSettings({ ..._settings, initialized: true })
  }
}

export const getDefaultCalendarOptions = async () => {
  const theme = await getCurrentTheme()
  const _theme = theme === 'dark' ? 'dark' : 'light'
  let defaultView = logseq.settings?.defaultView || 'month'
  if (logseq.settings?.defaultView === '2week') defaultView = 'month'
  return {
    defaultView,
    taskView: true,
    scheduleView: true,
    useDetailPopup: true,
    isReadOnly: false,
    disableClick: true,
    theme: CALENDAR_THEME[_theme],
    usageStatistics: false,
    week: {
      startDayOfWeek: logseq.settings?.weekStartDay || 0,
      // narrowWeekend: true,
      hourStart: logseq.settings?.weekHourStart || 0,
      hourEnd: logseq.settings?.weekHourEnd || 24,
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
        const calendar = `<b style="font-weight: 600;">Project: ${schedule.isReadOnly ? schedule.calendarId : `<a id="faiz-nav-detail-project" href="javascript:void(0);">${schedule.calendarId}</a>`}</b>`
        const navBtn = schedule.raw?.subscription ? '' : '<br/><a id="faiz-nav-detail" href="javascript:void(0);">Navigate To Block</a>'
        // ${schedule.body?.split('\n').join('<br/>')}
        // TODO: 如果是 org 则不转义
        return `
          <div class="calendar-popup-detail-content">
            ${md.render(schedule.body || '')}
          </div>
          ${calendar}
          ${navBtn}
        `
      },
    },
  }
}

export const genDailyLogCalendarOptions = (defaultOptions) => {
  return {
    ...defaultOptions,
    isReadOnly: true,
    defaultView: 'week',
    taskView: ['time'],
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
        queryType: 'advanced',
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
        queryType: 'advanced',
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
        queryType: 'advanced',
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
        script: `(and (page "${pageName}") (task todo doing done later now waitting) (property end) (property start))`,
        scheduleStart: 'properties.start',
        scheduleEnd: 'properties.end',
        dateFormatter: 'yyyy-MM-dd',
        queryType: 'simple',
      },
      {
        script: `(and (page "${pageName}") (task todo doing done later now waitting) (property end) (property start))`,
        scheduleStart: 'properties.start',
        scheduleEnd: 'properties.end',
        dateFormatter: 'yyyy-MM-dd HH:mm',
        queryType: 'simple',
      },
      {
        script: `(and (page "${pageName}") [[milestone]] (property start))`,
        scheduleStart: 'properties.start',
        dateFormatter: 'yyyy-MM-dd',
        queryType: 'simple',
        isMilestone: true,
      },
    ]
  }
}