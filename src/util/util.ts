import { format, parse } from 'date-fns'
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
