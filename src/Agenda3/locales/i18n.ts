import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import type { Settings } from '../models/settings'
import translationEN from './en/translation.json'
import translationZH from './zh-CN/translation.json'

const resources = {
  en: {
    translation: translationEN,
  },
  'zh-CN': {
    translation: translationZH,
  },
}

export const init = () => {
  const lang = getInitialLanguage()
  console.log('[faiz:] === lang', lang)
  i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
  i18n.changeLanguage(lang)
}

/**
 * 读取 localStorage settings 中的 general.language 字段并设置为应用的初始语言
 * 如果没有设置过，则返回 en
 */
function getInitialLanguage() {
  if (import.meta.env.VITE_MODE === 'web') {
    const settings = localStorage.getItem('settings')
    if (settings) {
      const parsedSettings = JSON.parse(settings) as Settings
      return parsedSettings?.general?.language ?? 'en'
    }
  } else {
    const settings = logseq.settings as unknown as Settings
    return settings?.general?.language ?? 'en'
  }
}

export default i18n
