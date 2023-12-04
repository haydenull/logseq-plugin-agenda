import { Dropdown, message } from 'antd'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { BsArchive } from 'react-icons/bs'
import { RiDeleteBin4Line } from 'react-icons/ri'

import { deleteBlockDateInfo, updateBlockTaskStatus, deleteTaskBlock } from '@/Agenda3/helpers/block'
import { minutesToHHmm } from '@/Agenda3/helpers/fullCalendar'
import { formatTaskTitle } from '@/Agenda3/helpers/task'
import useAgendaTasks from '@/Agenda3/hooks/useAgendaTasks'
import { settingsAtom } from '@/Agenda3/models/settings'
import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { AgendaTask, AgendaTaskWithStart } from '@/types/task'
import { cn } from '@/util/util'

import Group from '../../Group'
import TaskModal from '../../modals/TaskModal'
import Toolbar from './Toolbar'

const TaskCard = ({ task }: { task: AgendaTaskWithStart }) => {
  const settings = useAtomValue(settingsAtom)
  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'

  const [editTaskModal, setEditTaskModal] = useState<{
    open: boolean
    task?: AgendaTask
  }>({
    open: false,
  })

  const editDisabled = task.rrule || task.recurringPast
  const isMultipleDays = task.allDay && task.end
  const estimatedTime = task.estimatedTime ?? DEFAULT_ESTIMATED_TIME
  const showTitle = formatTaskTitle(task)

  const { updateTaskData, deleteTask } = useAgendaTasks()

  const onClickTaskMark = (event: React.MouseEvent, task: AgendaTask, status: AgendaTask['status']) => {
    if (task.rrule) return message.error('Please modify the status of the recurring task in logseq.')
    updateTaskData(task.id, {
      ...task,
      status,
      rawBlock: {
        ...task.rawBlock,
        marker: status === 'todo' ? 'TODO' : 'DONE',
      },
    })
    updateBlockTaskStatus(task, status)
    event.stopPropagation()
  }
  const onDeleteTask = async (taskId: string) => {
    deleteTask(taskId)
    deleteTaskBlock(taskId)
  }
  const onRemoveDate = async (taskId: string) => {
    updateTaskData(taskId, {
      allDay: true,
      start: undefined,
    })
    deleteBlockDateInfo(taskId)
  }

  return (
    <>
      <div
        className={cn('bg-white rounded-md p-2 hover:shadow whitespace-pre-wrap cursor-pointer group/card', {
          'bg-[#edeef0] opacity-80': task.status === 'done',
          // 循环任务及多天任务不能拖拽
          'droppable-task-element': !editDisabled && !isMultipleDays,
        })}
        data-event={JSON.stringify({
          id: task.id,
          title: showTitle,
          duration: minutesToHHmm(estimatedTime),
          color: groupType === 'page' ? task.project.bgColor : task?.filters?.[0]?.color,
        })}
      >
        <Dropdown
          trigger={['contextMenu']}
          menu={{
            items: [
              editDisabled || task.project.isJournal
                ? null
                : {
                    key: 'backlog',
                    label: 'Move to backlog',
                    icon: <BsArchive className="!text-sm" />,
                  },
              {
                key: 'delete',
                label: 'Delete task',
                danger: true,
                icon: <RiDeleteBin4Line className="!text-base" />,
              },
            ],
            onClick: ({ key }) => {
              if (key === 'delete') onDeleteTask(task.id)
              if (key === 'backlog') onRemoveDate(task.id)
            },
          }}
        >
          <div onClick={() => setEditTaskModal({ open: true, task })}>
            {/* ========= Toolbar ========= */}
            <Toolbar task={task} groupType={groupType} onClickMark={onClickTaskMark} />

            {/* ========= Title ========= */}
            <div className={cn('text-gray-600 my-0.5', { 'line-through': task.status === 'done' })}>{showTitle}</div>

            {/* ========= Group(page or filter) Name ========= */}
            <Group task={task} type={groupType} />
          </div>
        </Dropdown>
      </div>

      {/* ========== Edit Task Modal ========== */}
      {editTaskModal.task ? (
        <TaskModal
          key={editTaskModal.task.id}
          open={editTaskModal.open}
          info={{ type: 'edit', initialTaskData: editTaskModal.task }}
          onOk={(taskInfo) => {
            updateTaskData(editTaskModal.task!.id, taskInfo)
            setEditTaskModal({ open: false })
          }}
          onCancel={() => setEditTaskModal({ open: false })}
          onDelete={(taskId) => {
            deleteTask(taskId)
            setEditTaskModal({ open: false })
          }}
        />
      ) : null}
    </>
  )
}

export default TaskCard
