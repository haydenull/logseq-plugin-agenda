import { ISchedule } from 'tui-calendar'
import List, { ITask } from './List'
import s from '../index.module.less'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import { catrgorizeTask as catrgorizeBlockTask, pureTaskBlockContent } from '@/util/logseq'
import { catrgorizeTask as catrgorizeSchedule } from '@/util/schedule'
import { Button } from 'antd'

const ListView: React.FC<{
  schedules: ISchedule[]
  projectId: string
}> = ({ schedules, projectId }) => {
  const [allTask, setAllTasks] = useState<BlockEntity[]>([])
  const [currentTask, setCurrentTask] = useState<ITask>()

  const scheduleIds = schedules.map(schedule => schedule.id)
  const undatedTasks = allTask.filter(block => !scheduleIds.includes(block.uuid))

  const undatedTaskMap = catrgorizeBlockTask(undatedTasks)
  const schedulesMap = catrgorizeSchedule(schedules)

  const todoTasks: ITask[] = [...schedulesMap.doing, ...schedulesMap.todo, ...undatedTaskMap.doing, ...undatedTaskMap.todo]
  const doneTasks: ITask[] = [...schedulesMap.done, ...undatedTaskMap.done]
  const canceledTasks: ITask[] = [...schedulesMap.canceled, ...undatedTaskMap.canceled]

  const navToBlock = async (blockUuid: string) => {
    // const rawData: any = schedule.raw || {}
    // const { id: pageId, originalName } = rawData?.page || {}
    // let pageName = originalName
    // // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
    // if (!pageName) {
    //   const page = await logseq.Editor.getPage(pageId)
    //   pageName = page?.originalName
    // }
    logseq.Editor.scrollToBlockInPage(projectId, blockUuid)
    logseq.hideMainUI()
  }

  useEffect(() => {
    if (!projectId || projectId?.toLowerCase() === 'journal') return
    logseq.DB.q(`(and (task todo doing now later canceled done) [[${projectId}]])`)
      .then(res => {
        if (res) setAllTasks(res)
      })
  }, [projectId])
  return (
    <div className="w-full h-full flex">
      <div className={classNames('w-1/2 overflow-auto', s.border)}>
        <List upcomingList={todoTasks} doneList={doneTasks} canceledList={canceledTasks} onSelect={setCurrentTask} value={currentTask?.id + ''} />
      </div>
      <div className="w-1/2 overflow-auto">
        {
          currentTask && currentTask?.calendarId && (
            <div className="pl-4">
              <h3>{currentTask.title}</h3>
              <p className="whitespace-pre-line">{currentTask.raw.fullContent}</p>
              <Button type="link" className="px-0" onClick={() => navToBlock(currentTask.id as string)}>Navigate To Block</Button>
            </div>
          )
        }
        {
          currentTask && (currentTask as BlockEntity)?.page && (
            <div className="pl-4">
              <h3>{pureTaskBlockContent(currentTask as BlockEntity)}</h3>
              <p>{(currentTask as BlockEntity).content}</p>
              <Button type="link" className="px-0" onClick={() => navToBlock((currentTask as BlockEntity).uuid!)}>Navigate To Block</Button>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default ListView
