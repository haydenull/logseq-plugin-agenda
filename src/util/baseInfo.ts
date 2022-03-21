import { DEFAULT_SETTINGS } from './constants'
import { ISettingsForm } from './type'

export const getInitalSettings = (): ISettingsForm => {
  let logKey = logseq.settings?.logKey
  // 适配 logKey 参数变化
  if (typeof logKey === 'string') {
    logKey = {
      ...DEFAULT_SETTINGS.logKey,
      id: logKey,
    }
  }
  return {
    ...DEFAULT_SETTINGS,
    ...logseq.settings,
    logKey,
  }
}