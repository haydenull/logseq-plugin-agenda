export const Language = {
  English: 'en',
  'Simplified Chinese': 'zh-hans',
} as const
export const LANGUAGES = [
  {
    value: Language.English,
    label: 'English',
  },
  {
    value: Language['Simplified Chinese'],
    label: '简体中文',
  },
]
