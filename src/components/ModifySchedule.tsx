import React, { useEffect, useState } from 'react'
import { DatePicker, Form, Input, Modal, Radio, Select } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import Calendar from 'tui-calendar'
import type { ICustomCalendar, ISettingsForm } from '../util/type'
import { deleteProjectTaskTime, genProjectTaskTime, genSchedule, getAgendaCalendars, modifyTimeInfo, removeTimeInfo, updateProjectTaskTime } from '@/util/schedule'
import { createBlockToSpecificBlock, getPageData, joinPrefixTaskBlockContent, moveBlockToNewPage, moveBlockToSpecificBlock, pureTaskBlockContent, updateBlock } from '@/util/logseq'
import { format } from 'date-fns'
import { MARKDOWN_POMODORO_REG, ORG_POMODORO_REG, SCHEDULE_PARENT_BLOCK } from '@/util/constants'
import { getInitalSettings, initializeSettings } from '@/util/baseInfo'
import { IEvent } from '@/util/events'
import { transformBlockToEvent, transformMilestoneEventToSchedule, transformTaskEventToSchedule } from '@/helper/transform'
import { DEFAULT_CALENDAR_STYLE } from '@/constants/style'
import { updatePomodoroInfo } from '@/helper/pomodoro'

export type IScheduleForm = {
  calendarId: string
  title: string
  start: Dayjs
  end: Dayjs
  isAllDay?: boolean
  keepRef?: boolean
}
export type IScheduleValue = Partial<IScheduleForm> & { id?: string; raw?: IEvent }

const ModifySchedule: React.FC<{
  visible: boolean
  initialValues?: IScheduleValue
  type?: 'create' | 'update'
  calendar?: Calendar
  showKeepRef?: boolean
  onSave?: () => void
  onCancel?: () => void
}> = ({ visible, initialValues, onCancel, onSave, type='create', calendar, showKeepRef }) => {
  const [showTime, setShowTime] = useState(!initialValues?.isAllDay)
  const { defaultDuration, projectList = [], journal } = getInitalSettings()

  const isInitialJournal = initialValues?.calendarId === 'Journal'
  const isInitialProject = projectList.some(({ id }) => id === initialValues?.calendarId)
  let projects = (!isInitialProject && !isInitialJournal && type === 'update') ? [journal, { id: initialValues?.calendarId, ...DEFAULT_CALENDAR_STYLE }, ...projectList] : [journal, ...projectList]

  const [form] = Form.useForm()

  const onFormChange = (changedValues, allValues) => {
    if (changedValues.isAllDay !== undefined) {
      setShowTime(!changedValues.isAllDay)
    }
    if (changedValues.start !== undefined) {
      form.setFieldsValue({
        end: changedValues.start?.clone().add(defaultDuration.value, defaultDuration.unit),
      })
    }
    // if (changedValues.calendarId?.value === 'journal') {
    //   const start = allValues.start
    //   const end = allValues.end
    //   if (!start.isSame(end, 'day')) {
    //     form.setFieldsValue({
    //       end: start.add(1, 'hour'),
    //     })
    //   }
    // }
  }
  const onClickSave = () => {
    form.validateFields().then(async values => {
      const { title, start, end, isAllDay, calendarId } = values
      const startTime = dayjs(start).format('HH:mm')
      const endTime = dayjs(end).format('HH:mm')
      const settings = getInitalSettings()
      const calendarConfig = projects.find(({ id }) => id === calendarId.value)
      let newScheduleType: 'journal' | 'project' = calendarConfig?.id === 'Journal' ? 'journal' : 'project'
      // console.log('[faiz:] === newScheduleType', newScheduleType)
      // console.log('[faiz:] === onClickSave', values)
      // 变更后的schedule是否是journal中的schedule
      const isJournalSchedule = newScheduleType === 'journal'
      if (dayjs(start).isAfter(dayjs(end), isAllDay ? 'day' : undefined)) return logseq.UI.showMsg('Start time cannot be later than end time', 'error')
      if (isJournalSchedule && !dayjs(start).isSame(dayjs(end), 'day')) return logseq.UI.showMsg('Journal schedule cannot span multiple days', 'error')

      // new block content
      // let newTitle = title
      const pomoReg = initialValues?.raw?.format === 'markdown' ? MARKDOWN_POMODORO_REG : ORG_POMODORO_REG
      let newTitle = (type === 'update' && initialValues?.raw?.addOns.pomodoros?.length) ? `${title} ${initialValues?.raw?.content.match(pomoReg)?.[0]}` : title
      if (newScheduleType === 'journal') {
        if (type === 'create') newTitle = isAllDay ? `TODO ${newTitle}` : `TODO ${startTime}-${endTime} ${newTitle}`
        if (type === 'update') {
          newTitle = isAllDay ? joinPrefixTaskBlockContent(initialValues?.raw!, newTitle) : joinPrefixTaskBlockContent(initialValues?.raw!, modifyTimeInfo(newTitle, startTime, endTime))
        }
      } else if (newScheduleType === 'project') {
        if (type === 'create') {
          newTitle = 'TODO ' + updateProjectTaskTime(newTitle, { start, end, allDay: isAllDay })
        } else if (type === 'update') {
          newTitle = joinPrefixTaskBlockContent(initialValues?.raw!, updateProjectTaskTime(newTitle, { start, end, allDay: isAllDay }))
        }
      }
      if (initialValues?.raw?.addOns.type === 'milestone') newTitle += ' #milestone'

      // new properties
      const newBlockPropeties = {}

      const { preferredDateFormat } = await logseq.App.getUserConfigs()
      // oldCalendarId: journal shcedule is journal page, other is calendar id
      let oldCalendarId = initialValues?.calendarId
      if (isJournalSchedule) {
        const oldStart = initialValues?.start
        if(oldStart) oldCalendarId = format(oldStart?.valueOf(), preferredDateFormat)
      }

      // newCalendarId: journal shcedule is journal page, other is calendar id
      let newCalendarId = calendarId.value
      if (isJournalSchedule) {
        const journalName = format(start.valueOf(), preferredDateFormat)
        const newPage = await logseq.Editor.createPage(journalName, {}, { journal: true })
        if (newPage) newCalendarId = newPage.originalName
      }

      if (type === 'create') {
        // create schedule
        const logKey: ISettingsForm['logKey'] = logseq.settings?.logKey
        let block
        if (isJournalSchedule) {
          block = logKey?.enabled
          ? await createBlockToSpecificBlock(newCalendarId!, `[[${logKey?.id}]]`, newTitle, newBlockPropeties)
          : await logseq.Editor.insertBlock(newCalendarId!, newTitle, {
            isPageBlock: true,
            sibling: true,
            properties: newBlockPropeties,
          })
        } else if (newScheduleType === 'project') {
          block = await createBlockToSpecificBlock(newCalendarId!, SCHEDULE_PARENT_BLOCK, newTitle)
        }
        // else {
        //   block = await createBlockToSpecificBlock(newCalendarId, SCHEDULE_PARENT_BLOCK, newTitle, newBlockPropeties)
        // }
        if (!block) return logseq.App.showMsg('Create block failed', 'error')
        const _block = await logseq.Editor.getBlock(block.uuid)
        const event = await transformBlockToEvent(_block!, settings)
        const schedule = event?.addOns?.type === 'milestone' ? transformMilestoneEventToSchedule(event) : transformTaskEventToSchedule(event)
        calendar?.createSchedules([schedule])
      } else if (newCalendarId !== oldCalendarId) {
        // move schedule: move block to new page
        let newBlock
        const logKey: ISettingsForm['logKey'] = logseq.settings?.logKey
        // if (showKeepRef && values?.keepRef) {
        //   // const block = await logseq.Editor.getBlock(initialValues?.id)
        //   await logseq.Editor.insertBlock(initialValues?.id, `((${initialValues?.id}))${isJournalSchedule ? '' : ` #[[${newCalendarId}]]`}`, { before: false, sibling: true })
        // }
        if (isJournalSchedule) {
          newBlock = logKey?.enabled ? await moveBlockToSpecificBlock(initialValues?.id!, newCalendarId!, `[[${logKey?.id}]]`) : await moveBlockToNewPage(initialValues?.id!, newCalendarId!)
        } else if (newScheduleType === 'project') {
          newBlock = await moveBlockToSpecificBlock(initialValues?.id!, newCalendarId!, SCHEDULE_PARENT_BLOCK)
        }
        // else {
        //   newBlock = await moveBlockToSpecificBlock(initialValues.id, newCalendarId, SCHEDULE_PARENT_BLOCK)
        // }
        // 移动完成后需要设置 content
        await updateBlock(newBlock.uuid, newTitle, newBlockPropeties)
        // calendar schedule 移动到 journal project 需要去除 start end 属性
        if (Object.keys(newBlockPropeties).length === 0) {
          await logseq.Editor.removeBlockProperty(newBlock.uuid, 'start')
          await logseq.Editor.removeBlockProperty(newBlock.uuid, 'end')
        }
        if (newBlock && initialValues?.calendarId) {
          const _newBlock = await logseq.Editor.getBlock(newBlock.uuid)
          // updateSchedule can't update id, so we need to create new schedule after delete old one
          calendar?.deleteSchedule(initialValues?.id!, initialValues.calendarId)
          const event = await transformBlockToEvent(_newBlock!, settings)
          const schedule = initialValues?.raw?.addOns.type === 'milestone' ? transformMilestoneEventToSchedule(event) : transformTaskEventToSchedule(event)
          calendar?.createSchedules([schedule])
        }
      } else {
        // update schedule
        await updateBlock(initialValues?.id!, newTitle)
        // else {
        //   await updateBlock(initialValues?.id!, title, newBlockPropeties)
        // }
        const blockAfterUpdated = await logseq.Editor.getBlock(initialValues?.id!)
        const event = await transformBlockToEvent(blockAfterUpdated!, settings)
        const schedule = initialValues?.raw?.addOns.type === 'task' ? transformTaskEventToSchedule(event) : transformMilestoneEventToSchedule(event)
        calendar?.updateSchedule(initialValues?.id!, initialValues?.calendarId!, schedule)
      }
      onSave?.()
    })
  }
  const onClickCancel = () => {
    onCancel?.()
  }

  return (
    <Modal
      title="Modify Schedule"
      visible={visible}
      onOk={onClickSave}
      onCancel={onClickCancel}
    >
      <Form
        form={form}
        onValuesChange={onFormChange}
        initialValues={{ isAllDay: true, ...initialValues, calendarId: initialValues?.calendarId ? { value: initialValues?.calendarId } : undefined }}
      >
        <Form.Item name="calendarId" label="Project" rules={[{ required: true }]}>
          <Select labelInValue>
            {projects.map(calendar => (
              <Select.Option key={calendar?.id} value={calendar?.id}>
                <span style={{ width: '12px', height: '12px', display: 'inline-block', backgroundColor: calendar?.bgColor, verticalAlign: 'middle', marginRight: '5px', borderRadius: '4px'}}></span>
                {calendar?.id}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="title" label="Schedule Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="start" label="Start" rules={[{ required: true }]}>
          <DatePicker showTime={showTime ? { format: 'HH:mm', minuteStep: 5 } : false} format={ showTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD' } />
        </Form.Item>
        <Form.Item name="end" label="End" rules={[{ required: true }]}>
          <DatePicker showTime={showTime ? { format: 'HH:mm', minuteStep: 5 } : false} format={ showTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD' } />
        </Form.Item>
        <Form.Item name="isAllDay" label="All Day" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value={true}>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </Form.Item>
        {/* {
          showKeepRef && (
            <Form.Item name="keepRef" label="Keep Ref">
              <Radio.Group>
                <Radio value={true}>Yes</Radio>
                <Radio value={false}>No</Radio>
              </Radio.Group>
            </Form.Item>
          )
        } */}
      </Form>
    </Modal>
  )
}

export default ModifySchedule
