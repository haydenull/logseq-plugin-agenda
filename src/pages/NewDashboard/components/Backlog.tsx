import { CaretRightOutlined } from '@ant-design/icons'
import { Draggable } from '@fullcalendar/interaction'
import { Collapse, Empty, Select } from 'antd'
import clsx from 'clsx'
import { useAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { BsArchive } from 'react-icons/bs'

import { categorizeTasksByPage } from '@/newHelper/task'
import { backlogTasksAtom } from '@/newModel/tasks'

import s from './backlog.module.less'

const Backlog = () => {
  const taskContainerRef = useRef<HTMLDivElement>(null)
  const [backlogTasks] = useAtom(backlogTasksAtom)
  const categorizedTasks = categorizeTasksByPage(backlogTasks)
  const projects = categorizedTasks.map(({ project }) => project)

  const [filterProjectIds, setFilterProjectIds] = useState<string[]>([])

  const showCategorizedTasks = categorizedTasks.filter((categorizedTask) => {
    if (filterProjectIds?.length > 0) {
      return filterProjectIds.includes(categorizedTask.project.id)
    }
    return true
  })

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
        <Select
          showSearch
          allowClear
          value={filterProjectIds}
          onChange={setFilterProjectIds}
          bordered={false}
          suffixIcon={null}
          className="w-[160px]"
          maxTagCount="responsive"
          placeholder="Filters"
          mode="multiple"
          optionFilterProp="label"
          popupClassName="min-w-[300px]"
          options={projects.map((project) => ({ label: project.originalName, value: project.id }))}
          filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
        />
      </div>
      <div
        className={clsx('flex flex-col gap-2 flex-1 overflow-auto pt-2', {
          'justify-center': showCategorizedTasks?.length <= 0,
        })}
        ref={taskContainerRef}
      >
        {showCategorizedTasks?.length > 0 ? (
          <Collapse
            accordion
            bordered={false}
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
            style={{ background: '#f9fafb' }}
            items={showCategorizedTasks.map((project) => ({
              key: project.project.originalName,
              label: project.project.originalName,
              children: (
                <div className="flex flex-col gap-2">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border rounded px-2 py-2 text-sm text-gray-600 break-all droppable-task-element bg-[#f9fafb] cursor-move"
                      data-event={JSON.stringify({
                        id: task.id,
                        title: task.title,
                        color: task.project.bgColor,
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
