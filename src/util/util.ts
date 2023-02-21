import { format, formatRFC3339, parse } from 'date-fns'
import { Dayjs } from 'dayjs'
// import en from 'dayjs/locale/en'
import { DEFAULT_JOURNAL_FORMAT, DEFAULT_SETTINGS, SHOW_DATE_FORMAT } from './constants'
import { ISettingsForm } from './type'

// dayjs.locale({
//   ...en,
//   weekStart: 1,
// })

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

export const log = (msg, color='blue') => console.log(`%c${msg}`, `color:${color}`)

export const setPluginTheme = (theme: 'dark' | 'light') => {
  const html = document.querySelector('html')
  const lightTheme = logseq.settings?.lightThemeType || DEFAULT_SETTINGS.lightThemeType
  const prevLightTheme = lightTheme === 'green' ? 'purple' : 'green'
  if (theme === 'dark') {
    html?.classList.add('dark')
    html?.classList.remove(lightTheme)
    // insertCss('./antd.dark.min.css')
  } else {
    html?.classList.remove('dark', prevLightTheme)
    html?.classList.add(lightTheme)
    // insertCss('./antd.min.css')
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

// 监听 esc 按钮
export const listenEsc = (callback: () => void) => {
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      callback()
    }
  })
}

// 判断是 windows mac linux
export const getOS = () => {
  const userAgent = navigator.userAgent
  const isWindows = userAgent.indexOf('Windows') > -1
  const isMac = userAgent.indexOf('Macintosh') > -1
  const isLinux = userAgent.indexOf('Linux') > -1
  if (isWindows) return 'windows'
  if (isMac) return 'mac'
  if (isLinux) return 'linux'
  return 'unknown'
}

// let antdCssFile: HTMLLinkElement | null = null
// 插入 css 文件
export const insertCss = (css: string) => {
  const style = document.createElement('link')
  style.rel = 'stylesheet'
  style.href = css
  style.className = 'antd-css'

  const head = document.head || document.getElementsByTagName('head')[0]
  const firstChild = head.childNodes[0]
  if (firstChild) {
    head.insertBefore(style, firstChild)
  } else {
    head.appendChild(style)
  }
  const antdCssFileList = head.querySelectorAll('.antd-css')
  Array.from(antdCssFileList)?.slice(1)?.forEach(element => {
    head.removeChild(element)
  })
  // if (antdCssFile?.[1]) head.removeChild(antdCssFile[1])
}

export const toggleAppTransparent = (transparent: boolean) => {
  const html = document.querySelector('html')
  const body = document.querySelector('body')
  if (transparent) {
    html?.classList.add('modal-app')
    body?.classList.add('modal-app')
  } else {
    html?.classList.remove('modal-app')
    body?.classList.remove('modal-app')
  }
}

export const extractDays = (startDate: Dayjs, endDate: Dayjs): Dayjs[] => {
  const days: Dayjs[] = []
  let day = startDate
  while (day.isSameOrBefore(endDate)) {
    days.push(day.clone())
    day = day.add(1, 'day')
  }
  return days
}

export const genRandomString = (length: number = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const parseUrlParams = (url: string): Record<string, string> => {
  const l = new URL(url).searchParams
  let res = {}
  l.forEach((val, key) => res[key] = val)
  return res
}

export const notification = (msg: string) => {
  const notification = new Notification(msg)
  notification.onclick = () => {
    notification.close()
  }
}

export const formatDayjsToRFC3339 = (day: Dayjs, fractionDigits: 0|1|2|3 = 0) => {
  return formatRFC3339(day.toDate(), { fractionDigits })
}

export const genLinkText = (text: string, url: string, format: 'markdown' | 'org' = 'markdown') => {
  return format === 'org' ? `[${url}][${text}]]` : `[${text}](${url})`
}

// convert minutes to hours
export const convertMinutesToHours = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}