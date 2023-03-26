import { DEFAULT_PROJECT } from '@/util/constants'

const initializePageMenuItem = () => {
  logseq.App.registerPageMenuItem('Agenda: Add this page to agenda project', async ({ page }) => {
    const pageData = await logseq.Editor.getPage(page)
    if (!pageData) return logseq.UI.showMsg('Page not found', 'error')
    const originalProjectList = logseq.settings?.projectList || []
    const pageName = pageData.originalName
    if (originalProjectList.find(project => project.id === pageName)) return logseq.UI.showMsg('This Page is already in agenda project', 'warning')
    const newProject = {
      ...DEFAULT_PROJECT,
      id: pageName,
    }
    // hack https://github.com/logseq/logseq/issues/4447
    logseq.updateSettings({projectList: 1})
    // ensure subscription list is array
    logseq.updateSettings({ ...logseq.settings, projectList: originalProjectList.concat(newProject)})
    logseq.UI.showMsg('Successfully added')
  })
}

export default initializePageMenuItem