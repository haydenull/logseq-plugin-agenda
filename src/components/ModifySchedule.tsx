import React, { useEffect, useState } from 'react'
import { DatePicker, Form, Input, Modal, Radio, Select } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import Calendar from 'tui-calendar'
import type { ICustomCalendar, ISettingsForm } from '../util/type'
import { genSchedule, getAgendaCalendars, modifyTimeInfo, removeTimeInfo } from '../util/schedule'
import { getPageData, moveBlockToNewPage, updateBlock } from '../util/logseq'
import { format } from 'date-fns'

export type IScheduleForm = {
  calendarId: string
  title: string
  start: Dayjs
  end: Dayjs
  isAllDay?: boolean
}
export type IScheduleValue = Partial<IScheduleForm> & { id?: string; raw?: any }

const ModifySchedule: React.FC<{
  visible: boolean
  initialValues?: IScheduleValue
  type?: 'create' | 'update'
  calendar?: Calendar
  onSave?: () => void
  onCancel?: () => void
}> = ({ visible, initialValues, onCancel, onSave, type='create', calendar }) => {
  const [agendaCalendars, setAgendaCalendars] = useState<ISettingsForm['calendarList']>([])
  const [showTime, setShowTime] = useState(!initialValues?.isAllDay)

  const [form] = Form.useForm()

  const onFormChange = (changedValues, allValues) => {
    if (changedValues.isAllDay !== undefined) {
      setShowTime(!changedValues.isAllDay)
    }
    if (changedValues.start !== undefined) {
      form.setFieldsValue({
        end: changedValues.start.add(1, 'hour'),
      })
    }
    if (changedValues.calendarId?.value === 'journal') {
      const start = allValues.start
      const end = allValues.end
      if (!start.isSame(end, 'day')) {
        form.setFieldsValue({
          end: start.add(1, 'hour'),
        })
      }
    }
  }
  const onClickSave = () => {
    form.validateFields().then(async values => {
      const { calendarId, title, start, end, isAllDay } = values
      const startDate = dayjs(start).format('YYYY-MM-DD')
      const endDate = dayjs(end).format('YYYY-MM-DD')
      const startTime = dayjs(start).format('HH:mm')
      const endTime = dayjs(end).format('HH:mm')
      const calendarConfig = agendaCalendars.find(c => c.id === calendarId?.value)
      console.log('[faiz:] === onClickSave', values)
      // 变更后的schedule是否是journal中的schedule
      const isJournalSchedule = calendarId?.value === 'journal'
      if (dayjs(start).isAfter(dayjs(end))) return logseq.App.showMsg('Start time cannot be later than end time', 'error')
      if (isJournalSchedule && !dayjs(start).isSame(dayjs(end), 'day')) return logseq.App.showMsg('Journal schedule cannot span multiple days', 'error')

      // new block content
      let newTitle = `TODO ${title}`
      if (isJournalSchedule) {
        if (type === 'create') newTitle = isAllDay ? `TODO ${title}` : `TODO ${startTime}-${endTime} ${title}`
        if (type === 'update') {
          const marker = initialValues?.raw?.marker
          const pureTitle = title.replace(new RegExp(`^${marker} `), '')
          newTitle = isAllDay ? `${marker} ` + removeTimeInfo(pureTitle) : `${marker} ` + modifyTimeInfo(pureTitle, startTime, endTime)
        }
      }
      if (!isJournalSchedule && type === 'update') {
        const marker = initialValues?.raw?.marker
        const pureTitle = title.replace(new RegExp(`^${marker} `), '')
        newTitle = `${marker} ` + removeTimeInfo(pureTitle)
      }

      // new properties
      const newBlockPropeties = isJournalSchedule ? {} : {
        start: isAllDay ? startDate : `${startDate} ${startTime}`,
        end: isAllDay ? endDate : `${endDate} ${endTime}`,
      }

      const { preferredDateFormat } = await logseq.App.getUserConfigs()
      // oldCalendarId: journal shcedule is journal page, other is calendar id
      let oldCalendarId = initialValues?.calendarId
      if (initialValues?.calendarId === 'journal') {
        const oldStart = initialValues?.start
        if(oldStart) oldCalendarId = format(oldStart?.valueOf(), preferredDateFormat)
      }

      // newCalendarId: journal shcedule is journal page, other is calendar id
      let newCalendarId = calendarId?.value
      if (calendarId?.value === 'journal') {
        console.log('[faiz:] === values', values)
        const journalName = format(start.valueOf(), preferredDateFormat)
        const newPage = await logseq.Editor.createPage(journalName, {}, { journal: true })
        if (newPage) newCalendarId = newPage.originalName
        console.log('[faiz:] === journalName', journalName, newPage)
        // const newPage = await logseq.Editor.createPage()
      }

      if (type === 'create') {
        // create schedule
        const block = await logseq.Editor.insertBlock(newCalendarId, newTitle, {
          isPageBlock: true,
          sibling: true,
          properties: newBlockPropeties,
        })
        if (!block) return logseq.App.showMsg('Create block failed', 'error')
        const _block = await logseq.Editor.getBlock(block.uuid)
        calendar?.createSchedules([await genSchedule({
          blockData: _block,
          category: isAllDay ? 'allday' : 'time',
          start: dayjs(start).format(),
          end: dayjs(end).format(),
          // @ts-ignore
          calendarConfig,
          isAllDay,
          isReadOnly: false,
        })])
      } else if (newCalendarId !== oldCalendarId && initialValues?.id) {
        // move schedule: move block to new page
        const newBlock = await moveBlockToNewPage(Number(initialValues.id), newCalendarId)
        // journal 移动到 agenda 日历后，需要设置时间
        await updateBlock(newBlock.uuid, newTitle, newBlockPropeties)
        // agenda 日历移动到 journal 需要去除 start end 属性
        if (Object.keys(newBlockPropeties).length === 0) {
          await logseq.Editor.removeBlockProperty(newBlock.uuid, 'start')
          await logseq.Editor.removeBlockProperty(newBlock.uuid, 'end')
        }
        if (!newBlock || !initialValues.calendarId) return
        const _newBlock = await logseq.Editor.getBlock(newBlock.uuid)
        // updateSchedule can't update id, so we need to create new schedule after delete old one
        calendar?.deleteSchedule(String(initialValues.id), initialValues.calendarId)
        calendar?.createSchedules([await genSchedule({
          blockData: _newBlock,
          category: isAllDay ? 'allday' : 'time',
          start: dayjs(start).format(),
          end: dayjs(end).format(),
          // @ts-ignore
          calendarConfig,
          isAllDay,
          isReadOnly: false,
        })])
        // calendar?.updateSchedule(initialValues.id as unknown as string, initialValues.calendarId, )
        // MoveBlock does not appear to support moving between pages
        // logseq.Editor.moveBlock(block?.uuid, page.uuid)
      } else if (initialValues?.id) {
        // update schedule
        if (calendarId.value === 'journal') {
          await updateBlock(Number(initialValues.id), newTitle)
        } else {
          await updateBlock(Number(initialValues.id), title, newBlockPropeties)
        }
        const blockAfterUpdated = await logseq.Editor.getBlock(Number(initialValues.id))
        console.log('[faiz:] === blockAfterUpdated', blockAfterUpdated)
        calendar?.updateSchedule(initialValues.id, calendarId?.value, await genSchedule({
          blockData: blockAfterUpdated,
          category: isAllDay ? 'allday' : 'time',
          start: dayjs(start).format(),
          end: dayjs(end).format(),
          // @ts-ignore
          calendarConfig,
          isAllDay,
          isReadOnly: false,
        }))
      }
      onSave?.()
    })
  }
  const onClickCancel = () => {
    onCancel?.()
  }

  useEffect(() => {
    const { calendarList } = logseq.settings as unknown as ISettingsForm
    getAgendaCalendars().then(agendaPages => {
      // if (agendaPages?.length <= 0) return logseq.App.showMsg('No agenda page found\nYou can create an agenda calendar first', 'warning')
      setAgendaCalendars([calendarList[0]].concat(agendaPages))
    })
  }, [])

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
        initialValues={{ ...initialValues, calendarId: initialValues?.calendarId ? { value: initialValues?.calendarId } : undefined }}
      >
        <Form.Item name="calendarId" label="Calendar" rules={[{ required: true }]}>
          <Select labelInValue>
            {agendaCalendars.map(calendar => (
              <Select.Option key={calendar.id} value={calendar.id}>
                <span style={{ width: '12px', height: '12px', display: 'inline-block', backgroundColor: calendar.bgColor, verticalAlign: 'middle', marginRight: '5px', borderRadius: '4px'}}></span>
                {calendar.id}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="title" label="Schedule Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="start" label="Start" rules={[{ required: true }]}>
          <DatePicker showTime={showTime ? { format: 'HH:mm' } : false} />
        </Form.Item>
        <Form.Item name="end" label="End" rules={[{ required: true }]}>
          <DatePicker showTime={showTime ? { format: 'HH:mm' } : false} />
        </Form.Item>
        <Form.Item name="isAllDay" label="All Day" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value={true}>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ModifySchedule
