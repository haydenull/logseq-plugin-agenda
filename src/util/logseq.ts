import { ISettingsForm } from "./type"

export const updateBlock = async (blockId: number | string, content: string | false, properties?: Record<string, any>) => {
  const block = await logseq.Editor.getBlock(blockId)
  if (!block) {
    logseq.App.showMsg('Block not found', 'error')
    return Promise.reject(new Error('Block not found'))
  }
  if (content) {
    // propteties param not working
    await logseq.Editor.updateBlock(block.uuid, content)
  }
  const upsertBlockPropertyPromises = Object.keys(properties || {}).map(key => logseq.Editor.upsertBlockProperty(block.uuid, key, properties?.[key]))
  return Promise.allSettled(upsertBlockPropertyPromises)
}

export const moveBlockToNewPage = async (blockId: number, pageName: string) => {
  const block = await getBlockData({ id: blockId })
  if (!block) return logseq.App.showMsg('moveBlockToNewPage: Block not found', 'error')
  const page = await logseq.Editor.createPage(pageName)
  if (!page) return logseq.App.showMsg('Create page failed', 'error')
  await logseq.Editor.moveBlock(block.uuid, page.uuid)
  return await getBlockData({ uuid: block.uuid })
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
  if (import.meta.env.DEV) return 'green'
  const logseqTheme = await logseq.App.getStateFromStore<'dark' | 'light'>('ui/theme')
  const lightTheme = (logseq.settings?.lightTheme as ISettingsForm['lightTheme']) || 'green'
  return logseqTheme === 'dark' ? 'dark' : lightTheme
}