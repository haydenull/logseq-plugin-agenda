import { BACKGROUND_COLOR, DEFAULT_BG_COLOR_NAME } from '@/constants/agenda'
import type { AgendaProject } from '@/types/project'
import type { AgendaTaskPage } from '@/types/task'

export const getAllProjects = async () => {
  const favoritePages = (await logseq.App.getCurrentGraphFavorites()) || []
  const pages = (await logseq.Editor.getAllPages()) || []
  const _pages = pages?.map((page) => {
    return transformPageToProject(
      {
        ...page,
        isJournal: page['journal?'],
      },
      favoritePages,
    )
  })
  const unFavoritePages = _pages?.filter((page) => !page.isFavorite)

  return [
    ...favoritePages.map((pageName) => {
      console.log
      return _pages?.find((p) => p.originalName?.toLocaleLowerCase() === pageName)
    }),
    ...unFavoritePages,
  ].filter(Boolean)
}

export const transformPageToProject = (page: AgendaTaskPage, favoritePages: string[]): AgendaProject => {
  // query 查询的 properties 属性名为原始值
  // getAllPage 查询的 properties 属性名为会转为驼峰
  const originalColor = page.properties?.['agenda-color'] || page.properties?.agendaColor
  const colorName = originalColor || DEFAULT_BG_COLOR_NAME
  const bgColor = BACKGROUND_COLOR[colorName] || BACKGROUND_COLOR[DEFAULT_BG_COLOR_NAME]
  return {
    ...page,
    id: page.uuid,
    isJournal: page['journal?'],
    isFavorite: favoritePages.includes(page.originalName?.toLocaleLowerCase()),
    bgColor,
  }
}
