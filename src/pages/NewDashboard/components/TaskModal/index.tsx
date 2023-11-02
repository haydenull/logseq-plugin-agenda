import { Button, Calendar, Input, type InputRef, Modal, Popover, Popconfirm, DatePicker, message, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useEffect, useState } from 'react'
import { BiCategory } from 'react-icons/bi'
import { BsCalendar4Event, BsCalendar4Range, BsClipboard, BsClock, BsClockHistory } from 'react-icons/bs'
import { MdOutlineCategory } from 'react-icons/md'
import { RiDeleteBin4Line } from 'react-icons/ri'

import DurationSelect from '@/components/TaskModal/components/DurationSelect'
import TimeSelect from '@/components/TaskModal/components/TimeSelect'
import { SHOW_DATETIME_FORMATTER, SHOW_DATE_FORMATTER } from '@/constants/agenda'
import { deleteTask } from '@/newHelper/block'
import { type BlockFromQuery, transformBlockToAgendaTask } from '@/newHelper/task'
import type { AgendaTask, TimeLog } from '@/types/task'

import ProjectSelect from '../ProjectSelect'
import TimeLogComponent from './TimeLog'
import useCreate, { type CreateTaskForm } from './useCreate'
import useEdit from './useEdit'

const TaskModal = ({
  open,
  info,
  children,
  onOk,
  onCancel,
  onDelete,
  triggerClassName,
}: {
  open?: boolean
  onCancel?: () => void
  onOk?: (task: AgendaTask) => void
  onDelete?: (taskId: string) => void
  children?: React.ReactNode
  triggerClassName?: string
  info:
    | {
        type: 'create'
        initialData: Partial<CreateTaskForm>
      }
    | {
        type: 'edit'
        initialTaskData: AgendaTask
      }
}) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const _open = children ? internalOpen : open
  const [mode, setMode] = useState<'Normal' | 'Advanced'>('Normal')
  const titleInputRef = React.useRef<InputRef>(null)

  const createHookResult = useCreate(info.type === 'create' ? info.initialData : null)
  const editHookResult = useEdit(info.type === 'edit' ? info.initialTaskData : null)
  const {
    formData,
    updateFormData,
    reset: resetFormData,
    allDay,
    start,
  } = info.type === 'create' ? createHookResult : editHookResult
  const { create } = createHookResult
  const { edit } = editHookResult
  const action = info.type === 'edit' ? edit : create

  const showStartTimeFormatter = allDay ? SHOW_DATE_FORMATTER : SHOW_DATETIME_FORMATTER

  const handleCancel = () => {
    setInternalOpen(false)
    onCancel?.()
  }
  const handleOk = async () => {
    umami.track(`Task Modal: Ok Button`, { type: info.type })
    const block = await action()
    if (!block) return message.error('Failed to create/edit task block')
    const page = await logseq.Editor.getPage(block?.page?.id ?? block?.page)
    if (!page) return message.error('Failed to find page')
    const favoritePages = (await logseq.App.getCurrentGraphFavorites()) || []
    const task = await transformBlockToAgendaTask(
      {
        ...block,
        page: {
          ...page,
          originalName: page.originalName,
          journalDay: page.journalDay,
          isJournal: page?.['journal?'],
        },
      } as unknown as BlockFromQuery,
      favoritePages,
    )
    onOk?.(task)
    setInternalOpen(false)
  }
  const handleDelete = async () => {
    if (info.type === 'edit') {
      await deleteTask(info.initialTaskData.id)
      onDelete?.(info.initialTaskData.id)
      setInternalOpen(false)
    }
  }
  const handleSwitchRangeMode = (mode: 'range' | 'date') => {
    const start = formData.startDateVal ?? dayjs()
    const end = mode === 'range' ? start.add(1, 'day') : undefined
    updateFormData({ endDateVal: end })
  }
  const reset = () => {
    resetFormData()
    setMode('Normal')
    titleInputRef.current?.blur()
  }
  const addDefaultTimeLog = () => {
    const curTimeLogs = editHookResult.formData.timeLogs ?? []
    const lastTimeLog = curTimeLogs[curTimeLogs.length - 1]
    const DEFAULT_DURATION = 30
    let logStart = start && allDay === false ? start : dayjs().subtract(DEFAULT_DURATION, 'minute')
    if (lastTimeLog) logStart = lastTimeLog.end.add(DEFAULT_DURATION, 'minute')
    const logEnd = logStart.add(DEFAULT_DURATION, 'minute')
    updateFormData({ timeLogs: [...curTimeLogs, { start: logStart, end: logEnd, amount: DEFAULT_DURATION }] })
  }
  const deleteTimeLog = (index: number) => {
    const curTimeLogs = editHookResult.formData.timeLogs ?? []
    const newTimeLogs = curTimeLogs.filter((_, i) => index !== i)
    updateFormData({ timeLogs: newTimeLogs })
  }
  const updateTimeLog = (index: number, data: TimeLog) => {
    const curTimeLogs = editHookResult.formData.timeLogs ?? []
    const newTimeLogs = curTimeLogs.map((log, i) => {
      if (index === i) return data
      return log
    })
    updateFormData({ timeLogs: newTimeLogs })
  }
  useEffect(() => {
    // 增加延时，否则二次打开无法自动聚焦
    if (_open) setTimeout(() => titleInputRef.current?.focus(), 0)
  }, [_open])
  return (
    <>
      {children ? (
        <span className={triggerClassName} onClick={() => setInternalOpen(true)}>
          {children}
        </span>
      ) : null}
      <Modal
        className="!w-[620px]"
        open={_open}
        closeIcon={false}
        keyboard={false}
        maskClosable={false}
        onCancel={handleCancel}
        okText={info.type === 'create' ? 'Add Task' : 'Save'}
        onOk={handleOk}
        afterClose={reset}
        footer={[
          info.type === 'edit' ? (
            <Popconfirm
              key="delete"
              title="Delete the task"
              description="Are you sure to delete this task?"
              onConfirm={handleDelete}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          ) : null,
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="ok" type="primary" onClick={handleOk}>
            {info.type === 'create' ? 'Add Task' : 'Save'}
          </Button>,
        ]}
      >
        <Input
          ref={titleInputRef}
          bordered={false}
          placeholder="Title"
          className="!text-2xl !px-0"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
        />
        {/* ========== Start Date Start ========= */}
        {formData.endDateVal ? (
          <div className="flex my-2">
            <div className="w-[160px] text-gray-400 flex gap-1 items-center">
              <BsCalendar4Range /> Date Range
            </div>
            <div className="flex items-center group gap-1">
              <DatePicker.RangePicker
                allowClear={false}
                bordered={false}
                suffixIcon={null}
                value={[formData.startDateVal ?? dayjs(), formData.endDateVal]}
                // @ts-expect-error type correct
                onChange={(val: [Dayjs, Dayjs]) => val && updateFormData({ startDateVal: val[0], endDateVal: val[1] })}
              />
              <BsCalendar4Event
                className="text-gray-400 invisible group-hover:visible cursor-pointer"
                onClick={() => handleSwitchRangeMode('date')}
              />
            </div>
          </div>
        ) : (
          <div className="flex my-2">
            <div className="w-[160px] text-gray-400 flex gap-1 items-center">
              <BsCalendar4Event /> Start Date
            </div>
            <div className="flex items-center group gap-1">
              <Popover
                trigger={['click']}
                arrow={false}
                placement="bottomLeft"
                content={
                  <div className="w-[300px] p-2">
                    <Calendar
                      fullscreen={false}
                      value={formData.startDateVal}
                      onChange={(val) => updateFormData({ startDateVal: val })}
                    />
                    <TimeSelect
                      bordered
                      placeholder="Time"
                      value={formData.startTime}
                      onChange={(val) => updateFormData({ startTime: val })}
                    />
                  </div>
                }
              >
                <div className="hover:bg-gray-100 px-3 py-1 rounded cursor-pointer">
                  {formData.startDateVal && start ? (
                    start.format(showStartTimeFormatter)
                  ) : (
                    <span className="text-gray-400">Select start Date</span>
                  )}
                </div>
              </Popover>
              <BsCalendar4Range
                className="text-gray-400 invisible group-hover:visible cursor-pointer"
                onClick={() => handleSwitchRangeMode('range')}
              />
            </div>
          </div>
        )}
        {/* ========= Start Date End ========= */}

        {/* ========= Estimated Time Start ========= */}
        <div className="flex my-2">
          <div className="w-[160px] text-gray-400 flex gap-1 items-center">
            <BsClock /> Estimated Time
          </div>
          <DurationSelect
            bordered={false}
            className="w-[100px]"
            value={formData.estimatedTime}
            onChange={(val) => updateFormData({ estimatedTime: val })}
          />
        </div>
        {/* ========= Estimated Time End ========= */}

        {/* ========= Actual Time Start ========= */}
        {info.type === 'edit' ? (
          <div className="flex items-start">
            <div className="w-[160px] text-gray-400 flex gap-1 items-center h-[32px]">
              <BsClockHistory /> Actual Time
            </div>
            <div>
              <div className="px-3 py-1 flex gap-2 items-center cursor-pointer h-[32px]">
                {formData.actualTime}
                <div className="text-xs text-gray-400 hover:text-gray-800" onClick={addDefaultTimeLog}>
                  (Add a log)
                </div>
              </div>
              {editHookResult.formData.timeLogs?.map((timeLog, index) => (
                <div key={index} className="group flex items-center w-[220px] justify-between">
                  <TimeLogComponent
                    value={{ start: timeLog.start, end: timeLog.end, amount: timeLog.amount }}
                    onChange={(newTimeLog) => updateTimeLog(index, newTimeLog)}
                  />
                  <RiDeleteBin4Line
                    className="hidden group-hover:block text-red-300 hover:text-red-500 cursor-pointer"
                    onClick={() => deleteTimeLog(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {/* ========= Actual Time End ========= */}

        {/* ========= Project Start ========= */}
        <div className="flex my-2">
          <div className="w-[160px] text-gray-400 flex gap-1 items-center">
            <BsClipboard /> Project
          </div>
          <ProjectSelect value={formData.projectId} onChange={(val) => updateFormData({ projectId: val })} />
        </div>
        {/* ========= Project End ========= */}

        {/* <Divider className="!m-0" orientation="center" orientationMargin={0} dashed>
          <Button
            className="!p-0 !text-gray-400"
            type="link"
            onClick={() => setMode((_mode) => (_mode === 'Normal' ? 'Advanced' : 'Normal'))}
          >
            {mode === 'Normal' ? 'Normal' : 'Advanced'}
          </Button>
        </Divider> */}

        {mode === 'Advanced' ? (
          <div>
            {/* <div className="flex">
                <div className="w-[160px] text-gray-400 flex gap-1 items-center">
                  <LuCalendar /> Label
                </div>
                <TimeSelect className="w-[100px]" value={plannedTime} onChange={setPlannedTime} />
              </div>
              <div className="flex">
                <div className="w-[160px] text-gray-400 flex gap-1 items-center">
                  <LuCalendar /> Due
                </div>
                <TimeSelect className="w-[100px]" value={plannedTime} onChange={setPlannedTime} />
              </div>
              <div className="flex">
                <div className="w-[160px] text-gray-400 flex gap-1 items-center">
                  <LuCalendar /> Repeat
                </div>
                <TimeSelect className="w-[100px]" value={plannedTime} onChange={setPlannedTime} />
              </div> */}
          </div>
        ) : null}
      </Modal>
    </>
  )
}

export default TaskModal
