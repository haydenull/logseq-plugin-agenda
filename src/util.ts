export const getSchedules = async () => {
  console.log('[faiz:] === getSchedules start ===')
  const keyword = logseq.settings?.logKey || 'Daily Log'
  const schedules = await logseq.DB.q(`[[${keyword}]]`)
  const validSchedules = schedules?.filter(s => {
    const _content = s.content?.trim()
    return _content.length > 0 && _content !== `[[${keyword}]]` && s?.page?.journalDay
  })
  console.log('[faiz:] === validSchedules', validSchedules)
  return validSchedules
}