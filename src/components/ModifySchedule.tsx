import React, { useEffect, useState } from 'react'
import { DatePicker, Form, Input, Modal, Radio, Select } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { ICustomCalendar, ISettingsForm, updateBlock } from '../util/util'
import { PageEntity } from '@logseq/libs/dist/LSPlugin.user'

export type IScheduleForm = {
  calendarId: string
  title: string
  start: Dayjs
  end: Dayjs
  isAllDay?: boolean
}
export type IScheduleValue = Partial<IScheduleForm> & { id?: number; raw?: any }

const ModifySchedule: React.FC<{
  visible: boolean
  initialValues?: IScheduleValue
  type?: 'create' | 'update'
  onSave?: () => void
  onCancel?: () => void
}> = ({ visible, initialValues, onCancel, onSave, type='create' }) => {
  const [agendaCalendars, setAgendaCalendars] = useState<ICustomCalendar[]>([])
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
  }
  const onClickSave = () => {
    form.validateFields().then(async values => {
      const { calendarId, title, start, end, isAllDay } = values
      const startDate = dayjs(start).format('YYYY-MM-DD')
      const endDate = dayjs(end).format('YYYY-MM-DD')
      const startTime = dayjs(start).format('HH:mm')
      const endTime = dayjs(end).format('HH:mm')
      console.log('[faiz:] === onClickSave', values)

      if (type === 'create') {
        // create
        await logseq.Editor.insertBlock(calendarId?.value, `TODO ${title}`, {
          isPageBlock: true,
          sibling: true,
          properties: {
            start: isAllDay ? startDate : `${startDate} ${startTime}`,
            end: isAllDay ? endDate : `${endDate} ${endTime}`,
          },
        })
      } else if (calendarId !== initialValues?.calendarId && initialValues?.id) {
        // move
        const block = await logseq.Editor.getBlock(initialValues.id)
        if (!block) return logseq.App.showMsg('Block not found')
        const page = await logseq.Editor.getPage(calendarId?.value)
        if (!page) return logseq.App.showMsg('Calendar page not found')
        await logseq.Editor.removeBlock(block.uuid)
        await logseq.Editor.insertBlock(calendarId?.value, block.content, {
          isPageBlock: true,
          sibling: true,
          properties: block.properties,
        })
        // MoveBlock does not appear to support moving between pages
        // logseq.Editor.moveBlock(block?.uuid, page.uuid)
      } else if (initialValues?.id) {
        // update
        await updateBlock(initialValues.id, title, {
          start: isAllDay ? startDate : `${startDate} ${startTime}`,
          end: isAllDay ? endDate : `${endDate} ${endTime}`,
        })
      }
      onSave?.()
    })
  }
  const onClickCancel = () => {
    onCancel?.()
  }

  useEffect(() => {
    const { calendarList } = logseq.settings as unknown as ISettingsForm
    const calendarPagePromises = calendarList.map(calendar => logseq.Editor.getPage(calendar.id))
    Promise.all(calendarPagePromises).then((pages: (PageEntity | null)[]) => {
      console.log('[faiz:] === page', pages)

      const agendaPages = pages
                            .map((page, index) => {
                              if (!page) return page
                              if ((page as any)?.properties?.agenda !== true) return null
                              return calendarList[index]
                            })
                            .filter(Boolean)
      if (agendaPages?.length <= 0) return logseq.App.showMsg('No agenda page found\nPlease create an agenda calendar first', 'error')
      setAgendaCalendars(agendaPages as ICustomCalendar[])
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
        initialValues={initialValues}
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
        <Form.Item name="title" label="Agenda Title" rules={[{ required: true }]}>
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
