import { RobotOutlined } from '@ant-design/icons'
import { Button, DatePicker, Divider, Form, Input, message, Modal, Radio, Select, Space } from 'antd'
import { format } from 'date-fns'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useState } from 'react'
import type Calendar from 'tui-calendar'

import { DEFAULT_CALENDAR_STYLE } from '@/constants/style'
import { getScheduleInfoFromAI, type OpenAIMessageContent } from '@/helper/openai'
import {
  transformBlockToEvent,
  transformMilestoneEventToSchedule,
  transformTaskEventToSchedule,
} from '@/helper/transform'
import { getInitialSettings } from '@/util/baseInfo'
import { MARKDOWN_POMODORO_REG, ORG_POMODORO_REG, SCHEDULE_PARENT_BLOCK } from '@/util/constants'
import type { IEvent } from '@/util/events'
import {
  createBlockToSpecificBlock,
  joinPrefixTaskBlockContent,
  moveBlockToNewPage,
  moveBlockToSpecificBlock,
  updateBlock,
} from '@/util/logseq'
import { modifyTimeInfo, updateProjectTaskTime } from '@/util/schedule'

import type { ISettingsForm } from '../util/type'

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
  onSave?: () => void
  onCancel?: () => void
}> = ({ visible, initialValues, onCancel, onSave, type = 'create', calendar }) => {
  const [showTime, setShowTime] = useState(!initialValues?.isAllDay)
  const [scheduleMessage, setScheduleMessage] = useState('')
  const [scheduleFromAiLoading, setScheduleFromAiLoading] = useState(false)
  const { defaultDuration, projectList = [], journal, openai } = getInitialSettings()

  const isInitialJournal = initialValues?.calendarId === 'Journal'
  const isInitialProject = projectList.some(({ id }) => id === initialValues?.calendarId)
  const projects =
    !isInitialProject && !isInitialJournal && type === 'update'
      ? [journal, { id: initialValues?.calendarId, ...DEFAULT_CALENDAR_STYLE }, ...projectList]
      : [journal, ...projectList]

  const [form] = Form.useForm()

  const handleGenScheduleFromAI = async () => {
    setScheduleFromAiLoading(true)
    if (scheduleMessage?.length < 6) return message.error('Schedule message is too short')
    try {
      const data = await getScheduleInfoFromAI(scheduleMessage)
      const scheduleInfo = JSON.parse(data?.choices?.[0]?.message?.content) as OpenAIMessageContent
      const { title, start, end, isAllDay, project } = scheduleInfo
      form.setFieldsValue({
        title,
        start: dayjs(start),
        end: dayjs(end),
        isAllDay,
        calendarId: project ? { value: project } : undefined,
      })
      setShowTime(!isAllDay)
      setScheduleFromAiLoading(false)
    } catch (error) {
      message.error('Failed to generate schedule from AI, Please check your api key or language setting.')
      console.error(error)
      setScheduleFromAiLoading(false)
    }
  }
  const onFormChange = (changedValues, allValues) => {
    if (changedValues.isAllDay !== undefined) {
      setShowTime(!changedValues.isAllDay)
    }
    if (changedValues.start !== undefined) {
      form.setFieldsValue({
        end: changedValues.start?.clone().add(defaultDuration.value, defaultDuration.unit),
      })
    }
  }
  const onClickSave = () => {
    form.validateFields().then(async (values) => {
      const { title, start, end, isAllDay, calendarId } = values
      const startTime = dayjs(start).format('HH:mm')
      const endTime = dayjs(end).format('HH:mm')
      const settings = getInitialSettings()
      const calendarConfig = projects.find(({ id }) => id === calendarId.value)
      const newScheduleType: 'journal' | 'project' = calendarConfig?.id === 'Journal' ? 'journal' : 'project'
      // console.log('[faiz:] === newScheduleType', newScheduleType)
      // console.log('[faiz:] === onClickSave', values)
      // 变更后的schedule是否是journal中的schedule
      const isJournalSchedule = newScheduleType === 'journal'
      if (dayjs(start).isAfter(dayjs(end), isAllDay ? 'day' : undefined))
        return logseq.UI.showMsg('Start time cannot be later than end time', 'error')
      if (isJournalSchedule && !dayjs(start).isSame(dayjs(end), 'day'))
        return logseq.UI.showMsg('Journal schedule cannot span multiple days', 'error')

      // new block content
      const pomoReg = initialValues?.raw?.format === 'markdown' ? MARKDOWN_POMODORO_REG : ORG_POMODORO_REG
      let newTitle =
        type === 'update' && initialValues?.raw?.addOns.pomodoros?.length
          ? `${title} ${initialValues?.raw?.content.match(pomoReg)?.[0]}`
          : title
      if (newScheduleType === 'journal') {
        if (type === 'create') newTitle = isAllDay ? `TODO ${newTitle}` : `TODO ${startTime}-${endTime} ${newTitle}`
        if (type === 'update' && initialValues?.raw) {
          newTitle = isAllDay
            ? joinPrefixTaskBlockContent(initialValues.raw, newTitle)
            : joinPrefixTaskBlockContent(initialValues.raw, modifyTimeInfo(newTitle, startTime, endTime))
        }
      } else if (newScheduleType === 'project') {
        if (type === 'create') {
          newTitle = 'TODO ' + updateProjectTaskTime(newTitle, { start, end, allDay: isAllDay })
        } else if (type === 'update' && initialValues?.raw) {
          newTitle = joinPrefixTaskBlockContent(
            initialValues.raw,
            updateProjectTaskTime(newTitle, { start, end, allDay: isAllDay }),
          )
        }
      }
      if (initialValues?.raw?.addOns.type === 'milestone') newTitle += ' #milestone'

      // new properties
      const newBlockProperties = initialValues?.raw?.propertiesTextValues
      if (initialValues?.raw?.rawTime?.timeFrom === 'startProperty') {
        // remove start and end property
        delete newBlockProperties?.start
        delete newBlockProperties?.end
      }

      const { preferredDateFormat } = await logseq.App.getUserConfigs()
      // oldCalendarId: journal schedule is journal page, other is calendar id
      let oldCalendarId = initialValues?.calendarId
      if (isJournalSchedule) {
        const oldStart = initialValues?.start
        if (oldStart) oldCalendarId = format(oldStart?.valueOf(), preferredDateFormat)
      }

      // newCalendarId: journal schedule is journal page, other is calendar id
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
            ? await createBlockToSpecificBlock(newCalendarId!, `[[${logKey?.id}]]`, newTitle, newBlockProperties)
            : await logseq.Editor.insertBlock(newCalendarId!, newTitle, {
                isPageBlock: true,
                sibling: true,
              })
        } else if (newScheduleType === 'project') {
          block = await createBlockToSpecificBlock(newCalendarId!, SCHEDULE_PARENT_BLOCK, newTitle)
        }
        if (!block) return logseq.UI.showMsg('Create block failed', 'error')
        const _block = await logseq.Editor.getBlock(block.uuid)
        const event = await transformBlockToEvent(_block!, settings)
        const schedule =
          event?.addOns?.type === 'milestone'
            ? transformMilestoneEventToSchedule(event)
            : transformTaskEventToSchedule(event)
        calendar?.createSchedules([schedule])
      } else if (newCalendarId !== oldCalendarId) {
        // move schedule: move block to new page
        let newBlock
        const logKey: ISettingsForm['logKey'] = logseq.settings?.logKey
        if (isJournalSchedule && initialValues?.id) {
          newBlock = logKey?.enabled
            ? await moveBlockToSpecificBlock(initialValues.id, newCalendarId!, `[[${logKey?.id}]]`)
            : await moveBlockToNewPage(initialValues.id, newCalendarId!)
        } else if (newScheduleType === 'project' && initialValues?.id) {
          newBlock = await moveBlockToSpecificBlock(initialValues.id, newCalendarId!, SCHEDULE_PARENT_BLOCK)
        }
        // 移动完成后需要设置 content
        await updateBlock(newBlock.uuid, newTitle, newBlockProperties)
        if (newBlock && initialValues?.calendarId && initialValues?.id) {
          const _newBlock = await logseq.Editor.getBlock(newBlock.uuid)
          // updateSchedule can't update id, so we need to create new schedule after delete old one
          calendar?.deleteSchedule(initialValues.id, initialValues.calendarId)
          const event = await transformBlockToEvent(_newBlock!, settings)
          const schedule =
            initialValues?.raw?.addOns.type === 'milestone'
              ? transformMilestoneEventToSchedule(event)
              : transformTaskEventToSchedule(event)
          calendar?.createSchedules([schedule])
        }
      } else if (initialValues?.id && initialValues?.calendarId) {
        // update schedule
        await updateBlock(initialValues.id, newTitle, newBlockProperties)
        const blockAfterUpdated = await logseq.Editor.getBlock(initialValues.id)
        const event = await transformBlockToEvent(blockAfterUpdated!, settings)
        const schedule =
          initialValues?.raw?.addOns.type === 'task'
            ? transformTaskEventToSchedule(event)
            : transformMilestoneEventToSchedule(event)
        calendar?.updateSchedule(initialValues.id, initialValues.calendarId, schedule)
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
      open={visible}
      onOk={onClickSave}
      onCancel={onClickCancel}
      bodyStyle={{ paddingTop: '20px' }}
    >
      {/* {openai?.apiKey && (
        <div className="mb-6">
          <Space.Compact block>
            <Input
              placeholder="please input schedule message"
              value={scheduleMessage}
              onChange={(e) => setScheduleMessage(e.target.value)}
            />
            <Button
              type="primary"
              onClick={handleGenScheduleFromAI}
              icon={<RobotOutlined />}
              loading={scheduleFromAiLoading}
            >
              Gen with AI
            </Button>
          </Space.Compact>
          <Divider dashed />
        </div>
      )} */}
      <Form
        form={form}
        onValuesChange={onFormChange}
        initialValues={{
          isAllDay: true,
          ...initialValues,
          calendarId: initialValues?.calendarId ? { value: initialValues?.calendarId } : undefined,
        }}
      >
        <Form.Item name="calendarId" label="Project" rules={[{ required: true }]}>
          <Select
            labelInValue
            showSearch
            optionFilterProp="label"
            placeholder="Project Name"
            filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
          >
            {projects.map((calendar) => (
              <Select.Option key={calendar?.id} value={calendar?.id}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    display: 'inline-block',
                    backgroundColor: calendar?.bgColor,
                    verticalAlign: 'middle',
                    marginRight: '5px',
                    borderRadius: '4px',
                  }}
                ></span>
                {calendar?.id}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="title" label="Schedule Title" rules={[{ required: true }]}>
          <Input placeholder="please input schedule title" />
        </Form.Item>
        <Form.Item name="start" label="Start" rules={[{ required: true }]}>
          <DatePicker
            showTime={showTime ? { format: 'HH:mm', minuteStep: 5 } : false}
            format={showTime ? 'YYYY-MM-DD HH:mm ddd' : 'YYYY-MM-DD ddd'}
          />
        </Form.Item>
        <Form.Item name="end" label="End" rules={[{ required: true }]}>
          <DatePicker
            showTime={showTime ? { format: 'HH:mm', minuteStep: 5 } : false}
            format={showTime ? 'YYYY-MM-DD HH:mm ddd' : 'YYYY-MM-DD ddd'}
          />
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
