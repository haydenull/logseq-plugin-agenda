import { Button, Calendar, Modal, Popover, Popconfirm, DatePicker, message, Mentions } from 'antd'
import type { MentionsRef } from 'antd/es/mentions'
import dayjs, { type Dayjs } from 'dayjs'
import { useAtomValue } from 'jotai'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BsCalendar4Event, BsCalendar4Range, BsClock, BsClockHistory } from 'react-icons/bs'
import { GoGoal } from 'react-icons/go'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { RiCheckboxBlankCircleLine, RiDeleteBin4Line } from 'react-icons/ri'

import { updateBlockTaskStatus } from '@/Agenda3/helpers/block'
import { navToLogseqBlock } from '@/Agenda3/helpers/logseq'
import { track } from '@/Agenda3/helpers/umami'
import useAgendaEntities from '@/Agenda3/hooks/useAgendaEntities'
import usePages from '@/Agenda3/hooks/usePages'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { settingsAtom } from '@/Agenda3/models/settings'
import DurationSelect from '@/components/TaskModal/components/DurationSelect'
import TimeSelect from '@/components/TaskModal/components/TimeSelect'
import { SHOW_DATETIME_FORMATTER, SHOW_DATE_FORMATTER } from '@/constants/agenda'
import type { AgendaEntity } from '@/types/entity'
import type { AgendaTaskWithStart, TimeLog } from '@/types/task'
import { getOS } from '@/util/util'

import ObjectiveSelect from '../../forms/ObjectiveSelect'
import PageSelect from '../../forms/PageSelect'
import LogseqLogo from '../../icons/LogseqLogo'
import PageIcon from '../../icons/PageIcon'
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
  onOk?: () => void
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
        initialTaskData: AgendaTaskWithStart
      }
}) => {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const _open = children ? internalOpen : open
  const [mode, setMode] = useState<'Normal' | 'Advanced'>('Normal')
  const titleInputRef = React.useRef<MentionsRef>(null)
  const [titleTagSearchText, setTitleTagSearchText] = useState('')
  const settings = useAtomValue(settingsAtom)
  const { currentGraph } = useAtomValue(logseqAtom)
  const { allPages: pages, refreshPages } = usePages()

  const groupType = settings.selectedFilters?.length ? 'filter' : 'page'

  const { deleteEntity } = useAgendaEntities()

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
  // can't edit recurring task
  const editDisabled =
    info.type === 'edit' && (info.initialTaskData.rrule || info.initialTaskData.recurringPast) ? true : false

  const showStartTimeFormatter = allDay ? SHOW_DATE_FORMATTER : SHOW_DATETIME_FORMATTER

  const handleCancel = () => {
    setInternalOpen(false)
    onCancel?.()
  }
  const handleOk = async () => {
    track(`Task Modal: Ok Button`, { type: info.type })
    const task = await action()
    if (!task) return message.error('Failed to create task')
    onOk?.()
    setInternalOpen(false)
  }
  const handleDelete = async () => {
    if (info.type === 'edit') {
      deleteEntity(info.initialTaskData.id)
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
  const createPage = async () => {
    await logseq.Editor.createPage(titleTagSearchText)
    refreshPages()
    message.success('Page created')
  }
  const onSwitchTaskStatus = async (status: AgendaEntity['status']) => {
    if (editDisabled) return message.error('Please modify the status of the recurring task in logseq.')
    if (info.type !== 'edit') return

    await updateBlockTaskStatus(info.initialTaskData, status)
    onOk?.()
    onCancel?.()
    setInternalOpen(false)
  }
  // Add keyboard event listener
  useEffect(() => {
    function handleKeyDown(event) {
      const isMac = getOS() === 'mac'
      const mainModifierKey = isMac ? event.metaKey : event.ctrlKey

      if (event.code === 'KeyQ' && mainModifierKey) {
        // Close the modal on pressing ctrl+q (or cmd+q on Mac)
        onCancel?.()
        setInternalOpen(false)
        event.stopPropagation()
      } else if (event.code === 'KeyS' && mainModifierKey) {
        // Save and close the modal on pressing ctrl+s (or cmd+s on Mac)
        onOk?.()
        setInternalOpen(false)
        event.stopPropagation()
      } else if (event.code === 'Enter' && mainModifierKey) {
        // toggle TODO status on pressing ctrl+Enter (or cmd+Enter on Mac)
        if (info.type === 'edit' && info.initialTaskData.status === 'done') {
          onSwitchTaskStatus('todo')
        }
        if (info.type === 'edit' && info.initialTaskData.status === 'todo') {
          onSwitchTaskStatus('done')
          setInternalOpen(false)
        }
        event.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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
        footer={
          <div className="flex items-center justify-between">
            <div>
              {info.type === 'edit' && info.initialTaskData.status === 'todo' ? (
                <Button
                  className="inline-flex items-center px-2"
                  icon={<IoIosCheckmarkCircleOutline className="text-base" />}
                  disabled={editDisabled}
                  onClick={() => onSwitchTaskStatus('done')}
                >
                  {t('Complete')}
                </Button>
              ) : null}
              {info.type === 'edit' && info.initialTaskData.status === 'done' ? (
                <Button
                  className="inline-flex items-center px-2"
                  disabled={editDisabled}
                  icon={<RiCheckboxBlankCircleLine />}
                  onClick={() => onSwitchTaskStatus('todo')}
                >
                  {t('Incomplete')}
                </Button>
              ) : null}
              {info.type === 'edit' ? (
                <Popconfirm
                  key="delete"
                  title="Delete the task"
                  description="Are you sure to delete this task?"
                  onConfirm={handleDelete}
                >
                  <Button
                    className="inline-flex items-center px-2 hover:!border-red-500 hover:!text-red-500"
                    icon={<RiDeleteBin4Line />}
                  >
                    {t('Delete')}
                  </Button>
                </Popconfirm>
              ) : null}
              {info.type === 'edit' ? (
                <Button
                  className="inline-flex items-center justify-center text-gray-400"
                  shape="circle"
                  icon={<LogseqLogo />}
                  onClick={() => {
                    navToLogseqBlock(info.initialTaskData, currentGraph)
                    onCancel?.()
                    setInternalOpen(false)
                  }}
                />
              ) : null}
            </div>
            <div>
              <Button key="cancel" onClick={handleCancel}>
                {t('Cancel')}
              </Button>
              <Button key="ok" type="primary" onClick={handleOk} disabled={editDisabled}>
                {info.type === 'create' ? t('Add Task') : t('Save')}
              </Button>
            </div>
          </div>
        }
      >
        <Mentions
          autoFocus
          ref={titleInputRef}
          className="!border-0 !px-0 !text-2xl !shadow-none"
          placeholder="Title"
          prefix="#"
          options={pages.map((page) => ({ value: page.originalName, label: page.originalName, key: page.id }))}
          value={formData.title}
          onChange={(val) => updateFormData({ title: val.replace(/\n/, '') })}
          notFoundContent={
            <Button type="link" size="small" onClick={createPage}>
              {t('New Page')}: {titleTagSearchText}
            </Button>
          }
          onSearch={(text) => setTitleTagSearchText(text)}
        />
        {/* ========== Start Date Start ========= */}
        {formData.endDateVal ? (
          <div className="my-2 flex">
            <div className="flex w-[160px] items-center gap-1 text-gray-400">
              <BsCalendar4Range /> {t('Date Range')}
            </div>
            <div className="group flex items-center gap-1">
              <DatePicker.RangePicker
                allowClear={false}
                bordered={false}
                suffixIcon={null}
                value={[formData.startDateVal ?? dayjs(), formData.endDateVal]}
                // @ts-expect-error type correct
                onChange={(val: [Dayjs, Dayjs]) => val && updateFormData({ startDateVal: val[0], endDateVal: val[1] })}
              />
              <BsCalendar4Event
                className="invisible cursor-pointer text-gray-400 group-hover:visible"
                onClick={() => handleSwitchRangeMode('date')}
              />
            </div>
          </div>
        ) : (
          <div className="my-2 flex">
            <div className="flex w-[160px] items-center gap-1 text-gray-400">
              <BsCalendar4Event /> {t('Start Date')}
            </div>
            <div className="group flex items-center gap-1">
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
                <div className="cursor-pointer rounded px-3 py-1 hover:bg-gray-100">
                  {formData.startDateVal && start ? (
                    start.format(showStartTimeFormatter)
                  ) : (
                    <span className="text-gray-400">{t('Select start Date')}</span>
                  )}
                </div>
              </Popover>
              <BsCalendar4Range
                className="invisible cursor-pointer text-gray-400 group-hover:visible"
                onClick={() => handleSwitchRangeMode('range')}
              />
            </div>
          </div>
        )}
        {/* ========= Start Date End ========= */}

        {/* ========= Estimated Time Start ========= */}
        <div className="my-2 flex">
          <div className="flex w-[160px] items-center gap-1 text-gray-400">
            <BsClock /> {t('Estimated Time')}
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
            <div className="flex h-[32px] w-[160px] items-center gap-1 text-gray-400">
              <BsClockHistory /> {t('Actual Time')}
            </div>
            <div>
              <div className="flex h-[32px] cursor-pointer items-center gap-2 px-3 py-1">
                {formData.actualTime}
                <div className="text-xs text-gray-400 hover:text-gray-800" onClick={addDefaultTimeLog}>
                  ({t('Add a log')})
                </div>
              </div>
              {editHookResult.formData.timeLogs?.map((timeLog, index) => (
                <div key={index} className="group flex w-[220px] items-center justify-between">
                  <TimeLogComponent
                    value={{ start: timeLog.start, end: timeLog.end, amount: timeLog.amount }}
                    onChange={(newTimeLog) => updateTimeLog(index, newTimeLog)}
                  />
                  <RiDeleteBin4Line
                    className="hidden cursor-pointer text-red-300 hover:text-red-500 group-hover:block"
                    onClick={() => deleteTimeLog(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {/* ========= Actual Time End ========= */}

        {/* ========= Objective Start ========= */}
        {/* <div className="my-2 flex">
          <div className="flex w-[160px] items-center gap-1 text-gray-400">
            <GoGoal /> Objective
          </div>
          <ObjectiveSelect
            date={formData.startDateVal ?? dayjs()}
            value={formData.bindObjectiveId}
            onChange={(val) => updateFormData({ bindObjectiveId: val })}
          />
        </div> */}
        {/* ========= Objective End ========= */}

        {/* ========= Page Start ========= */}
        <div className="my-2 flex">
          <div className="flex w-[160px] items-center gap-1 text-gray-400">
            <PageIcon /> {t('Page')}
          </div>
          <PageSelect
            showPageColor={groupType === 'page'}
            value={formData.projectId}
            onChange={(val) => updateFormData({ projectId: val })}
          />
        </div>
        {/* ========= Page End ========= */}

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
