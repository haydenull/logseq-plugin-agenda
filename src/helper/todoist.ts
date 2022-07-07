import { transformBlockToEvent } from './transform';
import { getInitalSettings } from '@/util/baseInfo'
import { TodoistApi, Task, UpdateTaskArgs, AddTaskArgs } from '@doist/todoist-api-typescript'
import { IEvent } from '@/util/events';
import dayjs from 'dayjs';
import { format } from 'date-fns';

let instance: TodoistApi | null = null
export const getTodoistInstance = (token?: string) => {
  if (token) return instance = new TodoistApi(token)

  const { todoist } = getInitalSettings()
  if (todoist?.token) return instance = new TodoistApi(todoist.token)
}


export const pullTask = async () => {
  if (!instance) return logseq.App.showMsg('Please check your todoist configuration', 'error')
  const settings = getInitalSettings()
  const { preferredDateFormat } = await logseq.App.getUserConfigs()
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

  let needUpdateEvents: (IEvent & { todoistTask?: Task })[] = []
  let needCreateTasks: Task[] = []

  tasks.forEach(task => {
    const correspondEvent = events.find(event => event.properties?.todoistId === task.id)
    if (!correspondEvent) return needCreateTasks.push(task)
    if (isEventNeedUpdate(correspondEvent, task)) return needUpdateEvents.push({ ...correspondEvent, todoistTask: task })
  })
  const eventsNotInActiveTasksPromise = events
    .filter(event => event.addOns.status !== 'done')
    .filter(event => !tasks.find(task => task.id === event.properties?.todoistId))
    .map(async event => ({ ...event, todoistTask: await instance?.getTask(event.properties?.todoistId) }))
  const eventsNotInActiveTasksRes = await Promise.allSettled(eventsNotInActiveTasksPromise)
  const eventsNotInActiveTasks = eventsNotInActiveTasksRes.map(res => {
    if (res.status === 'rejected') return null
    return res.value
  }).filter(Boolean)
  // @ts-ignore
  needUpdateEvents = [...needUpdateEvents, ...eventsNotInActiveTasks]

  console.log('[faiz:] === pullTask res', needUpdateEvents, needCreateTasks, eventsNotInActiveTasks)

  needCreateTasks.forEach(task => createBlock(task, preferredDateFormat))
  needUpdateEvents.forEach(event => updateBlock(event, event.todoistTask))
}
export const updateTask = (id: number, params: UpdateTaskArgs) => instance?.updateTask(id, params)
export const getTask = (id: number) => instance?.getTask(id)
export const closeTask = (id: number) => instance?.closeTask(id)
export const reopenTask = (id: number) => instance?.reopenTask(id)
export const createTask = (args: AddTaskArgs) => instance?.addTask(args)

export const destroy = () => {
  instance = null
}

export const getTodoistBlocks = async () => {
  const query = '(and (task todo doing done waiting canceled later now) (property todoist-id))'
  return logseq.DB.q(query)
}

// If the logseq block is inconsistent with todoist task, the block needs to be updated.
export const isEventNeedUpdate = (event: IEvent, task: Task) => {
  const _completed = event.addOns.status === 'done'
  const _datetime = event.rawTime ? dayjs(event.rawTime?.start).valueOf() : undefined
  const _content = event.addOns.contentWithoutTime?.split('\n')[0]

  const { completed, due, content } = task
  let datetime = due ? (
    due?.datetime ? dayjs(due?.datetime).valueOf() : dayjs(due.date).valueOf()
  ) : undefined
  if (_completed !== completed || _content !== content || _datetime !== datetime) return true
  return false
}

export const createBlock = async (task: Task, dateFormat: string) => {
  const date = task.due?.datetime || task.due?.date
  const journalName = format(dayjs().valueOf(), dateFormat)
  const page = await logseq.Editor.createPage(journalName, {}, { journal: true })

  let content = `TODO ${task.content}`
  if (date) {
    const template = task.due?.datetime ? 'YYYY-MM-DD ddd HH:mm' : 'YYYY-MM-DD ddd'
    content += `\nSCHEDULED: <${dayjs(date).format(template)}>`
  }

  return logseq.Editor.insertBlock(page!.originalName, content, {
    isPageBlock: true,
    sibling: true,
    properties: {
      'todoist-id': task.id,
    },
  })
}
export const updateBlock = async (event: IEvent, task?: Task) => {
  if (!task) return

  const date = task.due?.datetime || task.due?.date
  let content = `${task.completed ? 'DONE' : 'TODO'} ${task.content}`
  if (date) {
    const template = task.due?.datetime ? 'YYYY-MM-DD ddd HH:mm' : 'YYYY-MM-DD ddd'
    content += `\nSCHEDULED: <${dayjs(date).format(template)}>`
  }

  console.log('[faiz:] === updateBlock', event, task)
  await logseq.Editor.updateBlock(event.uuid, content)
  // updateBlock will remove all custom properties, so we need to add todoist-id again
  return logseq.Editor.upsertBlockProperty(event.uuid, 'todoist-id', task.id)
}