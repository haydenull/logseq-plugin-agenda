import { transformBlockToEvent } from './transform';
import { getInitalSettings } from '@/util/baseInfo'
import { TodoistApi, Task } from '@doist/todoist-api-typescript'
import { IEvent } from '@/util/events';

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
  const settings = getInitalSettings()
  const { todoist } = settings
  let tasks: Task[] = []
  if (todoist?.sync === 1 && todoist.project) {
    tasks = await instance.getTasks({ projectId: todoist.project })
  } else {
    tasks = await instance.getTasks()
  }
  const blocks = await getTodoistBlocks()
  const events = await Promise.all(blocks?.map(block => transformBlockToEvent(block, settings)) || [])
  console.log('[faiz:] === pullTask', tasks, events)

  let needUpdateEvents: (IEvent & { todoistTask: Task })[] = []
  let needCreateTasks: Task[] = []
}

export const destroy = () => {
  instance = null
}

export const getTodoistBlocks = async () => {
  const query = '(and (task todo doing done waiting canceled later now) (property todoist-id))'
  return logseq.DB.q(query)
}