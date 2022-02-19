export const getDailyLog = async () => {
  const keyword = logseq.settings?.logKey || 'Daily Log'
  const schedules = await logseq.DB.q(`{{query [[${keyword}]]}}`)
  console.log('[faiz:] === schedules', schedules)
}