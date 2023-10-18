import { CaretRightOutlined } from '@ant-design/icons'
import { Draggable } from '@fullcalendar/interaction'
import { Collapse, Empty } from 'antd'
import clsx from 'clsx'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { BsArchive } from 'react-icons/bs'

import { categorizeTasksByPage } from '@/newHelper/task'
import { backlogTasksAtom } from '@/newModel/tasks'

import s from './backlog.module.less'

const Backlog = () => {
  const taskContainerRef = useRef<HTMLDivElement>(null)
  const [backlogTasks] = useAtom(backlogTasksAtom)
  const categorizedTasks = categorizeTasksByPage(backlogTasks)
  useEffect(() => {
    if (taskContainerRef.current) {
      new Draggable(taskContainerRef.current, {
        itemSelector: '.droppable-task-element',
      })
    }
  }, [backlogTasks.length])
  return (
    <div className={clsx('w-[290px] h-full border-l pl-2 flex flex-col bg-gray-50 shadow-md', s.backlog)}>
      <div className="h-[44px] flex items-center gap-1.5 relative after:shadow after:absolute after:bottom-0 after:w-full after:h-1">
        <BsArchive /> Backlog
      </div>
      <div
        className={clsx('flex flex-col gap-2 flex-1 overflow-auto pt-2', {
          'justify-center': categorizedTasks?.length <= 0,
        })}
        ref={taskContainerRef}
      >
        {categorizedTasks?.length > 0 ? (
          <Collapse
            accordion
            bordered={false}
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
            style={{ background: '#f9fafb' }}
            items={categorizedTasks.map((project) => ({
              key: project.project.originalName,
              label: project.project.originalName,
              children: (
                <div className="flex flex-col gap-2">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border rounded px-2 py-2 text-sm text-gray-600 break-all droppable-task-element bg-[#f9fafb]"
                      data-event={JSON.stringify({
                        id: task.id,
                        title: task.title,
                      })}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              ),
              style: {
                marginBottom: 10,
                borderRadius: 4,
                border: 'none',
                background: '#f0f0f0',
              },
            }))}
          />
        ) : (
          <Empty
            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
            imageStyle={{ height: 60, display: 'flex', justifyContent: 'center' }}
          />
        )}
      </div>
    </div>
  )
}

export default Backlog
