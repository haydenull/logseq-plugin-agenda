import { BlockEntity } from "@logseq/libs/dist/LSPlugin"
import { format } from "date-fns"
import { Dayjs } from "dayjs"
import { getInitalSettings } from "./baseInfo"
import { fillBlockReference } from "./schedule"
import { ISettingsForm } from "./type"
import { extractDays } from "./util"

export const updateBlock = async (blockId: number | string, content: string | false, properties?: Record<string, any>) => {
  const block = await logseq.Editor.getBlock(blockId)
  if (!block) {
    logseq.UI.showMsg('Block not found', 'error')
    return Promise.reject(new Error('Block not found'))
  }
  if (content) {
    // propteties param not working
    await logseq.Editor.updateBlock(block.uuid, content)
  }
  const upsertBlockPropertyPromises = Object.keys(properties || {}).map(key => logseq.Editor.upsertBlockProperty(block.uuid, key, properties?.[key]))
  return Promise.allSettled(upsertBlockPropertyPromises)
}

export const moveBlockToNewPage = async (blockUuid: string, pageName: string) => {
  // const block = await getBlockData({ id: blockId })
  // if (!block) return logseq.UI.showMsg('moveBlockToNewPage: Block not found', 'error')
  const page = await logseq.Editor.createPage(pageName)
  if (!page) return logseq.UI.showMsg('Create page failed', 'error')
  await logseq.Editor.moveBlock(blockUuid, page.uuid)
  return await getBlockData({ uuid: blockUuid })
}
export const moveBlockToSpecificBlock = async (srcBlockId: number | string, targetPageName: string, targetBlockContent: string) => {
  const query = typeof srcBlockId === 'number' ? { id: srcBlockId } : { uuid: srcBlockId }
  const srcBlock = await getBlockData(query)
  if (!srcBlock) return logseq.UI.showMsg('moveBlockToSpecificBlock: Block not found', 'error')
  let targetPage = await getPageData({ originalName: targetPageName })
  if (!targetPage) targetPage = await logseq.Editor.createPage(targetPageName)
  let targetBlock = await getSpecificBlockByContent(targetPageName, targetBlockContent)
  if (!targetBlock) targetBlock = await logseq.Editor.insertBlock(targetPageName, targetBlockContent, { before: true, isPageBlock: true })
  if (targetBlock) {
    await logseq.Editor.moveBlock(srcBlock.uuid, targetBlock.uuid, { children: true })
  }
  return await getBlockData({ uuid: srcBlock.uuid })
}
export const createBlockToSpecificBlock = async (targetPageName: string, targetBlockContent: string, blockContent: string, blockProperties: Record<string, any> = {}) => {
  let targetPage = await getPageData({ originalName: targetPageName })
  if (!targetPage) targetPage = await logseq.Editor.createPage(targetPageName)
  let targetBlock = await getSpecificBlockByContent(targetPageName, targetBlockContent)
  if (!targetBlock) targetBlock = await logseq.Editor.insertBlock(targetPageName, targetBlockContent, { before: true, isPageBlock: true })
  return await logseq.Editor.insertBlock(targetBlock!.uuid, blockContent, { isPageBlock: false, properties: blockProperties, sibling: false, before: false })
}

// https://logseq.github.io/plugins/interfaces/IEditorProxy.html#getBlock
const blockDataCacheMap = new Map()
export const getBlockData = async (params: { id?: number; uuid?: string }, useCache = false) => {
  const { id, uuid } = params
  const key = id || uuid
  if (!key) return Promise.reject(new Error('getBlockData: id or uuid is required'))
  if (useCache && blockDataCacheMap.has(key)) return blockDataCacheMap.get(key)
  const block = await logseq.Editor.getBlock(key)
  if (!block) return null
  const { id: _id, uuid: _uuid } = block
  blockDataCacheMap.set(_id, block)
  blockDataCacheMap.set(_uuid, block)
  return block
}

// https://logseq.github.io/plugins/interfaces/IEditorProxy.html#getPage
const pageDataCacheMap = new Map()
export const getPageData = async (srcPage: { id?: number; uuid?: string; originalName?: string }, opts?: Partial<{ includeChildren: boolean }>, useCache = false) => {
  const { id, uuid, originalName } = srcPage
  const key = id || uuid || originalName
  if (!key) return Promise.reject(new Error('getPageData: id, uuid or pageOriginalName is required'))
  if (useCache && pageDataCacheMap.has(key)) return pageDataCacheMap.get(key)
  const page = await logseq.Editor.getPage(key, opts)
  if (!page) return null
  const { id: _id, uuid: _uuid, originalName: _originName } = page
  pageDataCacheMap.set(_id, page)
  pageDataCacheMap.set(_uuid, page)
  pageDataCacheMap.set(_originName, page)
  return page
}

export const getCurrentTheme = async () => {
  const logseqTheme = import.meta.env.DEV ? 'light' : await logseq.App.getStateFromStore<'dark' | 'light'>('ui/theme')
  const _theme = logseq.settings?.theme === 'auto' ? logseqTheme : logseq.settings?.theme
  const lightTheme = (logseq.settings?.lightThemeType as ISettingsForm['lightThemeType']) || 'green'
  return _theme === 'dark' ? 'dark' : lightTheme
}

export const getSpecificBlockByContent = async (pageName: string, blockContent: string) => {
  const blocks = await logseq.Editor.getPageBlocksTree(pageName)
  const block = blocks.find(block => block.content === blockContent) || null
  return block
}

export const getJouralPageBlocksTree = async (start: Dayjs, end: Dayjs) => {
  const days = extractDays(start, end)
  const { preferredDateFormat } = await logseq.App.getUserConfigs()
  const promises = days.map(day => {
    const date = format(day.toDate(), preferredDateFormat)
    return logseq.Editor.getPageBlocksTree(date)
  })
  // @ts-ignore item是存在value属性的
  return (await Promise.allSettled(promises)).map(item => item?.value)
}

export const extractBlockContentToText = (block: BlockEntity) => {
  if (!block) return block
  let { content, children } = block
  if (children) {
    const childrenContent = children.map(child => extractBlockContentToText(child as BlockEntity)).join('\n')
    return content += '\n' + childrenContent
  }
  return content
}

export const extractBlockContentToHtml = async (block: BlockEntity, depth = 1): Promise<string> => {
  if (!block) return block
  let { content, children } = block
  content = await fillBlockReference(content)
  const intent = `margin-left: ${(depth - 1) * 20}px;`
  const contentHtml = `<p style="${intent} white-space: pre-line;">${content}</p>`
  if (children && children?.length > 0) {
    const childrenContent = (await Promise.all(children.map(async child => extractBlockContentToHtml(child as BlockEntity, depth + 1)))).join('')
    return contentHtml + childrenContent
  }
  return contentHtml
}

export const isEnabledAgendaPage = (pageName: string) => {
  const { calendarList } = getInitalSettings()
  return calendarList?.filter(calendar => calendar.enabled).some(calendar => calendar.id === pageName)
}

export const categorizeTask = (blocks: BlockEntity[]) => {
  const DOING_CATEGORY = ['DOING', 'NOW']
  const TODO_CATEGORY = ['TODO', 'LATER']
  const DONE_CATEGORY = ['DONE']
  const CANCELED_CATEGORY = ['CANCELED']
  return {
    doing: blocks.filter(block => DOING_CATEGORY.includes(block.marker)),
    todo: blocks.filter(block => TODO_CATEGORY.includes(block.marker)),
    done: blocks.filter(block => DONE_CATEGORY.includes(block.marker)),
    canceled: blocks.filter(block => CANCELED_CATEGORY.includes(block.marker)),
  }
}

export const getBlockUuidFromEventPath = (path: HTMLElement[]) => {
  let uuid: null | string = null
  for (let i = 0; i < path.length; i++) {
    const element = path[i]
    // const blockid = (element as any)?.blockid
    const blockid = element.getAttribute('blockid')
    if (element?.className?.includes('block-content') && blockid) {
      uuid = blockid
      break
    }
    i++
  }
  return uuid
}

export const pureTaskBlockContent = (block: BlockEntity, content?: string) => {
  const marker = block.marker
  const priority = block.priority
  let res = content || block.content
  return res?.replace(marker, '').trim().replace(`[#${priority}]`, '').trim()
}
export const joinPrefixTaskBlockContent = (block: BlockEntity, content: string) => {
  const marker = block.marker
  const priority = block.priority
  let res = content
  if (priority) res = `[#${priority}] ` + res
  if (marker) res = marker + ' ' + res
  return res
}

let DBChangeTimerIDMap = new Map<string, number>()
export const genDBTaskChangeCallback = (cb: (uuid: string) => void, delay = 2000) => {
  return ({ blocks, txData, txMeta }) => {
    const { marker, properties, uuid } = blocks[0]
    if (!marker || !properties?.todoistId || !uuid) return
    const timerId = DBChangeTimerIDMap.get(uuid)
    if (timerId) clearInterval(timerId)
    DBChangeTimerIDMap.set(uuid, window.setInterval(async () => {
      const checking = await logseq.Editor.checkEditing()
      if (checking !== uuid) {
        // when this block is not in editting state
        const _timerId = DBChangeTimerIDMap.get(uuid)
        clearInterval(_timerId)
        cb(uuid)
      }
    }, delay))
  }
}