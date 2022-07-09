import List from './List'
import s from '../index.module.less'
import classNames from 'classnames'
import { useState } from 'react'
import { categorizeTask } from '@/util/schedule'
import { Button } from 'antd'
import { IEvent } from '@/util/events'
import { useAtom } from 'jotai'
import { journalEventsAtom, projectEventsAtom } from '@/model/events'

const ListView: React.FC<{
  projectId: string
}> = ({ projectId }) => {
  const [currentTask, setCurrentTask] = useState<IEvent>()

  const [journalEvents] = useAtom(journalEventsAtom)
  const [projectEvents] = useAtom(projectEventsAtom)
  const events = projectId === 'Journal' ? journalEvents : projectEvents.get(projectId)

  const undatedTaskMap = categorizeTask(events?.tasks?.noTime || [])
  const schedulesMap = categorizeTask(events?.tasks?.withTime || [])

  const todoTasks: IEvent[] = [...schedulesMap.doing, ...schedulesMap.todo, ...undatedTaskMap.doing, ...undatedTaskMap.todo]
  const doneTasks: IEvent[] = [...schedulesMap.done, ...undatedTaskMap.done]
  const canceledTasks: IEvent[] = [...schedulesMap.canceled, ...undatedTaskMap.canceled]
  const waitingTasks: IEvent[] = [...schedulesMap.waiting, ...undatedTaskMap.waiting]

  const navToBlock = async (pageName:string, blockUuid: string) => {
    logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
    logseq.hideMainUI()
  }

  return (
    <div className="w-full h-full flex">
      <div className={classNames('w-1/2 overflow-auto', s.border)}>
        <List waitingList={waitingTasks} upcomingList={todoTasks} doneList={doneTasks} canceledList={canceledTasks} onSelect={setCurrentTask} value={currentTask?.id + ''} />
      </div>
      <div className="w-1/2 overflow-auto">
        {
          currentTask && (
            <div className="pl-4">
              <h3>{currentTask.addOns.showTitle}</h3>
              <p className="whitespace-pre-line">{currentTask.content}</p>
              <Button type="link" className="px-0" onClick={() => navToBlock(currentTask.page.originalName, currentTask.uuid)}>Navigate To Block</Button>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default ListView
