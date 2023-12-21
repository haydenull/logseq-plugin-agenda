import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

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

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
