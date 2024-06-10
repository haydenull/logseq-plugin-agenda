import type { AgendaEntity } from '@/types/entity'

export const navToLogseqBlock = (task: AgendaEntity, currentGraph?: { name: string }) => {
  const uuid = task.recurringPast ? task.id.split('_')[0] : task.id
  if (import.meta.env.VITE_MODE === 'plugin') {
    logseq.Editor.scrollToBlockInPage(task.project.originalName, uuid)
    logseq.hideMainUI()
  } else {
    if (!currentGraph) return
    // example: logseq://graph/zio?block-id=65385ad5-f4e9-4423-8595-a5e4236cc8ad
    window.open(`logseq://graph/${currentGraph.name}?block-id=${uuid}`, '_blank')
  }
}

export const LOGSEQ_API_CONFIG_KEY = 'logseq-api-config'
export const DEFAULT_LOGSEQ_API_CONFIG = {
  apiServer: import.meta.env.VITE_LOGSEQ_API_SERVER,
  apiToken: import.meta.env.VITE_LOGSEQ_API_TOKEN,
}
type LogseqApiConfig = { apiServer: string; apiToken: string }
/**
 * 获取 logseq api 配置
 */
export const getLogseqApiConfig = (): LogseqApiConfig => {
  try {
    const _config = JSON.parse(localStorage.getItem(LOGSEQ_API_CONFIG_KEY) || '{}') as LogseqApiConfig
    return { ...DEFAULT_LOGSEQ_API_CONFIG, ..._config }
  } catch (error) {
    console.error('Failed to parse logseq api config', localStorage.getItem(LOGSEQ_API_CONFIG_KEY), error)
    return DEFAULT_LOGSEQ_API_CONFIG
  }
}
