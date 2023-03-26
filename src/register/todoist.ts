import { pullTask, getTodoistInstance, updateTask, closeTask, getTask, reopenTask, createTask, updateBlock, PRIORITY_MAP, transformEventToTodoistEvent } from '@/helper/todoist'
import { AddTaskArgs, TodoistRequestError, UpdateTaskArgs } from '@doist/todoist-api-typescript'
import type { ISettingsForm } from "@/util/type"
import { transformBlockToEvent } from '@/helper/transform'
import { getInitialSettings } from '@/util/baseInfo'
import { findKey } from 'lodash'
import dayjs from 'dayjs'
import { genDBTaskChangeCallback } from '@/util/logseq'

const initializeTodoist = (todoist: ISettingsForm['todoist']) => {
  if (todoist?.token) {
    logseq.App.registerUIItem('toolbar', {
      key: 'plugin-agenda-todoist',
      template: '<a data-on-click="pullTodoistTasks" class="button"><i class="ti ti-chevrons-down"></i></a>',
    })
    getTodoistInstance()

    logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
      // console.log('[faiz:] === main DB.onChanged', blocks, txData, txMeta)
      const syncToTodoist = async (uuid: string) => {
        const block = await logseq.Editor.getBlock(uuid)
        const event = await transformBlockToEvent(block!, getInitialSettings())

        const todoistId = transformEventToTodoistEvent(event)?.todoistId
        try {
          const task = await getTask(todoistId)
          const priority = findKey(PRIORITY_MAP, v => v === event.priority)
          let params: UpdateTaskArgs = {
            content: event.addOns.contentWithoutTime?.split('\n')?.[0],
            description: block?.properties?.todoistDesc,
            priority,
          }
          if (event.addOns.allDay === true) params.dueDate = dayjs(event.addOns.start).format('YYYY-MM-DD')
          if (event.addOns.allDay === false) params.dueDatetime = dayjs.utc(event.addOns.start).format()
          if (!event.rawTime) params.dueString = 'no due date'
          if (event.addOns.status === 'done' && task?.isCompleted === false) return closeTask(todoistId)
          if (event.addOns.status !== 'done' && task?.isCompleted === true) return reopenTask(todoistId)
          updateTask(todoistId, params)
        } catch (error) {
          if ((error as TodoistRequestError).httpStatusCode === 404) {
            return logseq.UI.showMsg(`Todoist Sync Error\nmessage: ${(error as TodoistRequestError)?.responseData}\nPlease check whether the task has been deleted or whether the todoist-id is correct`, 'error')
          }
        }
      }
      genDBTaskChangeCallback(syncToTodoist)?.({ blocks, txData, txMeta })
    })

    // @ts-ignore The requirement to return a void can be ignored
    logseq.Editor.registerBlockContextMenuItem('Agenda: Upload to todoist', async ({ uuid }) => {
      const settings = getInitialSettings()
      const { todoist } = settings
      const block = await logseq.Editor.getBlock(uuid)
      if (!block?.marker) return logseq.UI.showMsg('This block is not a task', 'error')
      if (block?.properties?.todoistId) return logseq.UI.showMsg('This task has already been uploaded,\nplease do not upload it again', 'error')
      const event = await transformBlockToEvent(block!, settings)

      const priority = findKey(PRIORITY_MAP, v => v === event.priority)

      let params: AddTaskArgs = {
        content: event.addOns.contentWithoutTime?.split('\n')?.[0],
        description: block?.properties?.todoistDesc,
        priority,
      }
      if (event.addOns.allDay === true) params.dueDate = dayjs(event.addOns.start).format('YYYY-MM-DD')
      if (event.addOns.allDay === false) params.dueDatetime = dayjs.utc(event.addOns.start).format()
      if (todoist?.project) params.projectId = todoist.project
      if (todoist?.label) params.labels = [todoist.label]

      createTask(params)
        ?.then(async task => {
          await updateBlock(event, task)
          return logseq.UI.showMsg('Upload task to todoist success')
        })
        .catch(err => {
          logseq.UI.showMsg('Upload task to todoist failed', 'error')
          console.error('[faiz:] === Upload task to todoist failed', err)
        })

    })
  }
}

export default initializeTodoist