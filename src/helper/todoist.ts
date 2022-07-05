import { getInitalSettings } from '@/util/baseInfo'
import { TodoistApi, Task } from '@doist/todoist-api-typescript'

let instance: TodoistApi | null = null
export const getTodoistInstance = (token?: string) => {
  if (token) return instance = new TodoistApi(token)

  const { todoist } = getInitalSettings()
  if (todoist?.token) return instance = new TodoistApi(todoist.token)
}

export const uploadBlock = (uuid) => {
  console.log('[faiz:] === uploadBlock', uuid)
}

export const pullTask = async () => {
  if (!instance) return logseq.App.showMsg('Please check your todoist configuration', 'error')
  const { todoist } = getInitalSettings()
  let tasks: Task[] = []
  if (todoist?.sync === 1 && todoist.project) {
    tasks = await instance.getTasks({ projectId: todoist.project })
  } else {
    tasks = await instance.getTasks()
  }
  console.log('[faiz:] === pullTask', tasks)
}

export const destroy = () => {
  instance = null
}