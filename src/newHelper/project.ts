import tinycolor from 'tinycolor2'

import { BACKGROUND_COLOR, DEFAULT_BG_COLOR_NAME } from '@/constants/agenda'
import { autoTextColor } from '@/helper/autoTextColor'
import type { AgendaProject } from '@/types/project'
import type { AgendaTaskPage } from '@/types/task'

export const getAllProjects = async () => {
  const pages = (await logseq.Editor.getAllPages()) || []
  return pages?.map((page) => {
    return transformPageToProject({
      ...page,
      isJournal: page['journal?'],
    })
  })
}

export const transformPageToProject = (page: AgendaTaskPage): AgendaProject => {
  // query 查询的 properties 属性名为原始值
  // getAllPage 查询的 properties 属性名为会转为驼峰
  const originalColor = page.properties?.['agenda-color'] || page.properties?.agendaColor
  const originalFavorite = page.properties?.['agenda-favorite'] || page.properties?.agendaFavorite
  const colorName = originalColor || DEFAULT_BG_COLOR_NAME
  const bgColor = BACKGROUND_COLOR[colorName] || BACKGROUND_COLOR[DEFAULT_BG_COLOR_NAME]
  return {
    ...page,
    id: page.uuid,
    isJournal: page['journal?'],
    isFavorite: originalFavorite === 'yes',
    bgColor,
  }
}
