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

export const moveBlockToNewPage = async (blockId: number, pageName: string, content?: string, properties?: Record<string, any>) => {
  console.log('[faiz:] === moveBlockToNewPage', blockId, pageName, content, properties)
  const block = await logseq.Editor.getBlock(blockId)
  console.log('[faiz:] === block moveBlockToNewPage', block)
  if (!block) return logseq.App.showMsg('moveBlockToNewPage: Block not found', 'error')
  const page = await logseq.Editor.createPage(pageName)
  if (!page) return logseq.App.showMsg('Create page failed', 'error')
  await logseq.Editor.removeBlock(block.uuid)
  const newBlock = await logseq.Editor.insertBlock(pageName, content || block?.content, {
    isPageBlock: true,
    sibling: true,
    properties: properties || block?.properties,
  })
  return newBlock
}