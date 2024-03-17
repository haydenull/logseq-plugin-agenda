import { Dropdown, message } from 'antd'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { BsArchive } from 'react-icons/bs'
import { RiDeleteBin4Line } from 'react-icons/ri'
import { VscDebugConsole } from 'react-icons/vsc'

import { minutesToHHmm } from '@/Agenda3/helpers/fullCalendar'
import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { settingsAtom } from '@/Agenda3/models/settings'
import { DEFAULT_ESTIMATED_TIME } from '@/constants/agenda'
import type { AgendaEntity } from '@/types/entity'
import type { AgendaTaskWithStart } from '@/types/task'
import { cn } from '@/util/util'

import Group from '../../Group'
import TaskModal from '../../modals/TaskModal'
import Toolbar from './Toolbar'

const TaskCard = ({ task }: { task: AgendaTaskWithStart }) => {
  const currentGraph = useAtomValue(logseqAtom).currentGraph
  const settings = useAtomValue(settingsAtom)
  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'

  const [editTaskModal, setEditTaskModal] = useState<{
    open: boolean
    task?: AgendaTaskWithStart
  }>({
    open: false,
  })

  const editDisabled = task.rrule || task.recurringPast
  const isMultipleDays = task.allDay && task.end
  const estimatedTime = task.estimatedTime ?? DEFAULT_ESTIMATED_TIME

  const { updateEntity, deleteEntity } = useAgendaEntities()

  const onClickTaskMark = (event: React.MouseEvent, task: AgendaEntity, status: AgendaEntity['status']) => {
    if (task.rrule) return message.error('Please modify the status of the recurring task in logseq.')
    updateEntity({ type: 'task-status', id: task.id, data: status })
    event.stopPropagation()
  }
  const onDeleteTask = async (taskId: string) => {
    deleteEntity(taskId)
  }
  const onRemoveDate = async (taskId: string) => {
    updateEntity({ type: 'task-remove-date', id: taskId, data: null })
  }
  const onClickTask = (e: React.MouseEvent, task: AgendaTaskWithStart) => {
    if (e.ctrlKey) {
      navToLogseqBlock(task, currentGraph)
      console.log(task)
    } else {
      setEditTaskModal({ open: true, task })
    }
    e.stopPropagation()
  }

  return (
    <div
      className={cn('group/card cursor-pointer whitespace-pre-wrap rounded-md bg-white p-2 hover:shadow', {
        'bg-[#edeef0] opacity-80': task.status === 'done',
        // 循环任务及多天任务不能拖拽
        'droppable-task-element': !editDisabled && !isMultipleDays,
      })}
      data-event={JSON.stringify({
        id: task.id,
        title: task.showTitle,
        duration: minutesToHHmm(estimatedTime),
        color: groupType === 'page' ? task.project.bgColor : task?.filters?.[0]?.color,
      })}
      data-id={task.id}
    >
      <Dropdown
        trigger={['contextMenu']}
        menu={{
          items: [
            import.meta.env.DEV
              ? {
                  key: 'console',
                  label: 'Console task',
                  icon: <VscDebugConsole className="!text-base" />,
                }
              : null,
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
            if (key === 'console') console.log(task)
          },
        }}
      >
        <div
          onClick={(e) => {
            onClickTask(e, task)
          }}
        >
          {/* ========= Toolbar ========= */}
          <Toolbar task={task} groupType={groupType} onClickMark={onClickTaskMark} />

          {/* ========= Title ========= */}
          <div className={cn('my-0.5 text-gray-600', { 'line-through': task.status === 'done' })}>{task.showTitle}</div>

          {/* ========= Group(page or filter) Name ========= */}
          <Group task={task} type={groupType} />
        </div>
      </Dropdown>
      {/* ========== Edit Task Modal ========== */}
      {editTaskModal.task ? (
        <TaskModal
          key={editTaskModal.task.id}
          open={editTaskModal.open}
          info={{ type: 'edit', initialTaskData: editTaskModal.task }}
          onOk={() => {
            setEditTaskModal({ open: false })
          }}
          onCancel={() => setEditTaskModal({ open: false })}
          onDelete={() => {
            setEditTaskModal({ open: false })
          }}
        />
      ) : null}
    </div>
  )
}

export default TaskCard
