import { getInitalSettings } from '@/util/baseInfo'
import { TodoistApi } from '@doist/todoist-api-typescript'

let instance: TodoistApi | null = null
export const todoistInstance = () => {
  const {todoist} = getInitalSettings()
  if (todoist?.token && todoist?.project) return instance = new TodoistApi(todoist.token)
}

export const uploadBlock = (uuid) => {
  console.log('[faiz:] === uploadBlock', uuid)
}

export const pullTask = async () => {
  if (!instance) return logseq.App.showMsg('Please check your todoist configuration', 'error')
  const res = await instance.getTasks()
  console.log('[faiz:] === pullTask', res)
}

export const destroy = () => {
  instance = null
}