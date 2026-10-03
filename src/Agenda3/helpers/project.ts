import { BACKGROUND_COLOR, DEFAULT_BG_COLOR_NAME } from '@/constants/agenda'
import type { AgendaEntityPage } from '@/types/entity'
import type { AgendaProject } from '@/types/project'

export const getAllProjects = async () => {
  const favorites = (await logseq.App.getCurrentGraphFavorites()) ?? []
  const favoriteNames = favorites.map((page) =>
    (typeof page === 'string' ? page : page.originalName ?? page.title ?? page.name).toLocaleLowerCase(),
  )
  const pages = (await logseq.Editor.getAllPages()) ?? []
  const projects = pages.map((page) => {
    const originalName = page.originalName ?? page.title ?? page.name
    return transformPageToProject(
      {
        ...page,
        originalName,
        isJournal: Boolean(page['journal?']),
      },
      favoriteNames,
    )
  })
  const favoritesFirst = favoriteNames
    .map((name) => projects.find((project) => project.originalName.toLocaleLowerCase() === name))
    .filter((project): project is (typeof projects)[number] => project !== undefined)
  return [...favoritesFirst, ...projects.filter((project) => !project.isFavorite)]
}

export const transformPageToProject = (page: AgendaEntityPage, favoritePages: string[]): AgendaProject => {
  // query 查询的 properties 属性名为原始值
  // getAllPage 查询的 properties 属性名为会转为驼峰
  const originalColor = page.properties?.['agenda-color'] || page.properties?.agendaColor
  const colorName = originalColor || DEFAULT_BG_COLOR_NAME
  const bgColor = BACKGROUND_COLOR[colorName] || BACKGROUND_COLOR[DEFAULT_BG_COLOR_NAME]
  return {
    ...page,
    id: page.uuid,
    isJournal: page['journal?'],
    isFavorite: favoritePages.includes(page.originalName.toLocaleLowerCase()),
    bgColor,
  }
}
