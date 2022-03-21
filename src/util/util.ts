import { addHours, addMinutes, endOfDay, format, formatISO, isAfter, parse, parseISO, startOfDay } from 'date-fns'
// import en from 'dayjs/locale/en'
import { DEFAULT_BLOCK_DEADLINE_DATE_FORMAT, DEFAULT_JOURNAL_FORMAT, DEFAULT_SETTINGS, SHOW_DATE_FORMAT } from './constants'

// dayjs.locale({
//   ...en,
//   weekStart: 1,
// })


export const genCalendarDate = (date: number | string, format = DEFAULT_BLOCK_DEADLINE_DATE_FORMAT) => {
  return formatISO(parse('' + date, format, new Date()))
}



/**
 * 获取周报
 */
export const getWeekly = async (startDate, endDate) => {
  const keyword = logseq.settings?.logKey?.id || DEFAULT_SETTINGS.logKey?.id
  const { preferredDateFormat } = await logseq.App.getUserConfigs()
  const journalFormat = preferredDateFormat || DEFAULT_JOURNAL_FORMAT
  const _start = format(parse(startDate, SHOW_DATE_FORMAT, new Date()), journalFormat)
  const _end = format(parse(endDate, SHOW_DATE_FORMAT, new Date()), journalFormat)
  const logs = await logseq.DB.q(`(and [[${keyword}]] (between [[${_start}]] [[${_end}]]))`)
  const _logs = logs
                  ?.filter(block => block.content?.trim() === `[[${keyword}]]`)
                  ?.map(block => Array.isArray(block.parent) ? block.parent : [])
                  ?.flat()
                  ?.filter(block => {
                    const _content = block.content?.trim()
                    return _content.length > 0
                  })
  return _logs
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

export const log = (msg, color='blue') => console.log(`%c${msg}`, `color:${color}`)

export const setPluginTheme = (theme: 'dark' | 'light') => {
  const html = document.querySelector('html')
  if (theme === 'dark') {
    html?.classList.add('dark')
  } else {
    html?.classList.remove('dark')
  }
}
export const managePluginTheme = async () => {
  const { theme } = logseq.settings as ISettingsForm & {disabled: boolean}
  if (theme === 'dark') return setPluginTheme('dark')
  if (theme === 'light') return setPluginTheme('light')

  const logseqTheme = await logseq.App.getStateFromStore<'dark' | 'light'>('ui/theme')
  setPluginTheme(logseqTheme)
}



export const copyToClipboard = (text: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}

export const updateBlock = async (blockId: number, content: string | false, properties?: Record<string, any>) => {
  const block = await logseq.Editor.getBlock(blockId)
  if (!block) {
    logseq.App.showMsg('Block not found', 'error')
    return Promise.reject(new Error('Block not found'))
  }
  if (content) {
    // propteties param not working
    await logseq.Editor.updateBlock(block.uuid, content)
  }
  const upsertBlockPropertyPromises = Object.keys(properties || {}).map(key => logseq.Editor.upsertBlockProperty(block.uuid, key, properties?.[key]))
  return Promise.allSettled(upsertBlockPropertyPromises)
}