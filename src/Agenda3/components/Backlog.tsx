import { CaretRightOutlined } from '@ant-design/icons'
import { Draggable } from '@fullcalendar/interaction'
import { Collapse, Empty, Select } from 'antd'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { BsArchive } from 'react-icons/bs'
import { ReactSortable } from 'react-sortablejs'

import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import { categorizeTasksByPage, formatTaskTitle } from '@/Agenda3/helpers/task'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { settingsAtom } from '@/Agenda3/models/settings'
import useTheme from '@/hooks/useTheme'
import { cn } from '@/util/util'

import { backlogsAtom } from '../models/entities/backlogs'
import s from './backlog.module.less'
import LogseqLogo from './icons/LogseqLogo'

const Backlog = ({ bindCalendar = true }: { bindCalendar?: boolean }) => {
  const theme = useTheme()
  const taskContainerRef = useRef<HTMLDivElement>(null)
  const [backlogTasks] = useAtom(backlogsAtom)
  const { currentGraph } = useAtomValue(logseqAtom)
  const categorizedTasks = categorizeTasksByPage(backlogTasks)
  const projects = categorizedTasks.map(({ project }) => project)
  const settings = useAtomValue(settingsAtom)
  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'

  const [filterProjectIds, setFilterProjectIds] = useState<string[]>([])

  const showCategorizedTasks = categorizedTasks
    .filter((categorizedTask) => {
      if (filterProjectIds?.length > 0) {
        return filterProjectIds.includes(categorizedTask.project.id)
      }
      return true
    })
    .sort((a, b) => {
      return a.project.originalName?.localeCompare(b.project.originalName)
    })

  useEffect(() => {
    if (bindCalendar && taskContainerRef.current) {
      new Draggable(taskContainerRef.current, {
        itemSelector: '.droppable-task-element',
      })
    }
  }, [backlogTasks.length, bindCalendar])
  return (
    <div
      className={cn('flex h-full w-[290px] flex-col border-l bg-gray-50 pl-2 shadow-md dark:bg-zinc-900', s.backlog)}
    >
      <div className="relative flex h-[44px] items-center gap-1.5 after:absolute after:bottom-0 after:h-1 after:w-full after:shadow">
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
          placeholder="Filter by page"
          mode="multiple"
          optionFilterProp="label"
          popupClassName="min-w-[300px]"
          options={projects.map((project) => ({ label: project.originalName, value: project.id }))}
          filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
        />
      </div>
      <div
        className={cn('flex flex-1 flex-col gap-2 overflow-auto pt-2', {
          'justify-center': showCategorizedTasks?.length <= 0,
        })}
        ref={taskContainerRef}
      >
        {showCategorizedTasks?.length > 0 ? (
          <Collapse
            // accordion
            bordered={false}
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
            style={{ background: theme === 'dark' ? '#111' : '#f9fafb' }}
            defaultActiveKey={showCategorizedTasks.map((project) => project.project.originalName)}
            items={showCategorizedTasks.map((project) => ({
              key: project.project.originalName,
              label: project.project.originalName,
              extra: <span className="pr-0.5 text-xs text-gray-400">{project.tasks.length}</span>,
              children: (
                <ReactSortable
                  forceFallback
                  className="flex flex-col gap-2"
                  group="planner"
                  dragClass="dragged-mirror-element"
                  draggable=".droppable-task-element"
                  list={project.tasks}
                  setList={(list) => {
                    // console.log(`[faiz:] === setList`, list)
                  }}
                >
                  {project.tasks.map((task) => {
                    return (
                      <div
                        key={task.id}
                        className="droppable-task-element group cursor-move break-all rounded border bg-[#f9fafb] px-2 py-2 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                        data-event={JSON.stringify({
                          id: task.id,
                          title: task.showTitle,
                          color: groupType === 'page' ? task.project.bgColor : task.filters?.[0]?.color,
                          backlog: true,
                        })}
                      >
                        {task.showTitle}{' '}
                        <span
                          className="inline-block cursor-pointer text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            navToLogseqBlock(task, currentGraph)
                          }}
                        >
                          <LogseqLogo />
                        </span>
                      </div>
                    )
                  })}
                </ReactSortable>
              ),
              style: {
                marginBottom: 10,
                borderRadius: 4,
                border: 'none',
                background: theme === 'dark' ? '#111' : '#f0f0f0',
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
